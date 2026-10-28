from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import uuid
import json

from app.database import get_db
from app.models.models import TokenEnrolamiento

router = APIRouter()

# Servidor MDM corporativo (donde el dispositivo ya enrolado reporta estado).
SERVIDOR_MDM = os.getenv("MDM_SERVIDOR_IP", "10.181.8.8")

# El APK admin se descarga durante el provisioning (requiere HTTPS), por eso se
# publica en GitHub en vez del servidor corporativo (que es solo HTTP). El
# dispositivo necesita una red con salida a internet (ej. Starlink) para esta
# descarga inicial; luego de instalado ya usa la red corporativa para hablar
# con SERVIDOR_MDM.
APK_URL = os.getenv(
    "MDM_APK_URL",
    "http://10.181.8.8/apk/app-release.apk",
)
DEVICE_ADMIN = os.getenv("MDM_DEVICE_ADMIN", "com.palmas.mdm/com.palmas.mdm.DeviceAdminReceiver")

# SHA-256 del APK publicado en APK_URL, en Base64 URL-safe sin padding (formato
# que exige PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM). Si se publica un APK
# nuevo, este valor DEBE recalcularse y actualizarse, o el provisioning falla
# silenciosamente en el dispositivo al no coincidir el hash.
APK_CHECKSUM = os.getenv("MDM_APK_CHECKSUM", "mKSRk4uLOuhXa_i8I1wu9i6GIleHPAouoLJ-flvN7yA")
HORAS_EXPIRACION = 24


def token_a_dict(t: TokenEnrolamiento) -> dict:
    return {
        "id": t.id,
        "token": t.token,
        "sede": t.sede,
        "perfil_id": t.perfil_id,
        "perfil_nombre": t.perfil.nombre if t.perfil else None,
        "creado_en": t.creado_en.isoformat(),
        "expira_en": t.expira_en.isoformat(),
        "usado": t.usado,
        "dispositivo_imei": t.dispositivo_imei,
    }


@router.post("/generar")
def generar_token(body: dict, db: Session = Depends(get_db)):
    sede = body.get("sede", "Sin sede")
    perfil_id = body.get("perfil_id")

    token_str = str(uuid.uuid4())
    expira = datetime.utcnow() + timedelta(hours=HORAS_EXPIRACION)

    token = TokenEnrolamiento(
        token=token_str,
        sede=sede,
        perfil_id=perfil_id,
        expira_en=expira,
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    qr_data = json.dumps({
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": DEVICE_ADMIN,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": APK_URL,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": APK_CHECKSUM,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": False,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "token": token_str,
            "servidor": SERVIDOR_MDM,
            "sede": sede,
        }
    }, separators=(',', ':'))

    return {
        "token": token_a_dict(token),
        "qr_data": qr_data,
    }


@router.get("/tokens/{id}/qr")
def ver_qr_token(id: int, db: Session = Depends(get_db)):
    t = db.query(TokenEnrolamiento).filter(TokenEnrolamiento.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Token no encontrado")
    qr_data = json.dumps({
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": DEVICE_ADMIN,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": APK_URL,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": APK_CHECKSUM,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": False,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "token": t.token,
            "servidor": SERVIDOR_MDM,
            "sede": t.sede,
        }
    }, separators=(',', ':'))
    return {"qr_data": qr_data, "token": token_a_dict(t)}


@router.get("/tokens")
def listar_tokens(db: Session = Depends(get_db)):
    tokens = db.query(TokenEnrolamiento).order_by(TokenEnrolamiento.creado_en.desc()).limit(50).all()
    return [token_a_dict(t) for t in tokens]


@router.delete("/tokens/{id}")
def revocar_token(id: int, db: Session = Depends(get_db)):
    t = db.query(TokenEnrolamiento).filter(TokenEnrolamiento.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Token no encontrado")
    db.delete(t)
    db.commit()
    return {"mensaje": "Token revocado"}


@router.post("/validar")
def validar_token(body: dict, db: Session = Depends(get_db)):
    """Endpoint llamado por el dispositivo Android al enrolarse"""
    token_str = body.get("token")
    imei = body.get("imei")

    t = db.query(TokenEnrolamiento).filter(TokenEnrolamiento.token == token_str).first()
    if not t:
        raise HTTPException(status_code=404, detail="Token inválido")
    if t.usado:
        raise HTTPException(status_code=400, detail="Token ya fue utilizado")
    if datetime.utcnow() > t.expira_en:
        raise HTTPException(status_code=400, detail="Token expirado")

    t.usado = True
    t.dispositivo_imei = imei
    db.commit()

    politicas = {}
    if t.perfil:
        politicas = {
            "restricciones": t.perfil.restricciones,
            "apps_ocultar": t.perfil.apps_ocultar,
            "apps_proteger": t.perfil.apps_proteger,
            "bloqueo_auto_minutos": t.perfil.bloqueo_auto_minutos,
        }

    return {"valido": True, "sede": t.sede, "politicas": politicas}
