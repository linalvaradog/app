from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import json

from app.database import get_db
from app.models.models import TokenEnrolamiento

router = APIRouter()

SERVIDOR_MDM = "10.181.8.8"
APK_URL = f"http://{SERVIDOR_MDM}/apk/app-release.apk"
DEVICE_ADMIN = "com.grupopalmas.mdm/.DeviceAdminReceiver"
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
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": False,
        "android.app.extra.PROVISIONING_WIFI_SSID": "WIFI_IT",
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
