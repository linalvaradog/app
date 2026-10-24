from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.models import Dispositivo

router = APIRouter()

POLITICAS_DEFAULT = {
    "instalacionBloqueada": True,
    "factoryResetBloqueado": True,
    "usbDebuggingBloqueado": True,
    "pinRequerido": True,
}


def dispositivo_a_dict(d: Dispositivo) -> dict:
    return {
        "id": str(d.id),
        "imei": d.imei,
        "serial": d.serial,
        "modelo": d.modelo,
        "fabricante": d.fabricante,
        "android": d.android,
        "sede": d.sede,
        "estado": d.estado,
        "deviceOwner": d.device_owner,
        "ultimaConexion": d.ultima_conexion.strftime("%Y-%m-%d %H:%M") if d.ultima_conexion else None,
        "colaborador": d.colaborador,
        "politicas": d.politicas or POLITICAS_DEFAULT,
    }


@router.get("")
def get_dispositivos(db: Session = Depends(get_db)):
    return [dispositivo_a_dict(d) for d in db.query(Dispositivo).all()]


@router.get("/{id}")
def get_dispositivo(id: str, db: Session = Depends(get_db)):
    d = db.query(Dispositivo).filter(Dispositivo.id == int(id)).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return dispositivo_a_dict(d)


@router.post("/{id}/bloquear")
def bloquear_dispositivo(id: str, db: Session = Depends(get_db)):
    from app.mqtt import enviar_comando_mqtt
    d = db.query(Dispositivo).filter(Dispositivo.id == int(id)).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    d.estado = "bloqueado"
    db.commit()
    enviar_comando_mqtt(d.imei, "lock")
    return {"mensaje": "Dispositivo bloqueado correctamente"}


@router.post("/{id}/desbloquear")
def desbloquear_dispositivo(id: str, db: Session = Depends(get_db)):
    d = db.query(Dispositivo).filter(Dispositivo.id == int(id)).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    d.estado = "activo"
    db.commit()
    return {"mensaje": "Dispositivo desbloqueado correctamente"}


@router.post("/{id}/borrar")
def borrar_dispositivo(id: str, db: Session = Depends(get_db)):
    from app.mqtt import enviar_comando_mqtt
    d = db.query(Dispositivo).filter(Dispositivo.id == int(id)).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    enviar_comando_mqtt(d.imei, "wipe")
    return {"mensaje": "Comando de borrado enviado al dispositivo"}


@router.post("/{id}/comando")
def enviar_comando(id: str, body: dict, db: Session = Depends(get_db)):
    from app.mqtt import enviar_comando_mqtt
    d = db.query(Dispositivo).filter(Dispositivo.id == int(id)).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    comando = body.get("comando")
    enviar_comando_mqtt(d.imei, comando)
    return {"mensaje": f"Comando '{comando}' enviado al dispositivo"}


@router.post("/registrar")
def registrar_dispositivo(dispositivo: dict, db: Session = Depends(get_db)):
    existente = db.query(Dispositivo).filter(
        Dispositivo.imei == dispositivo.get("imei")
    ).first()
    if existente:
        existente.ultima_conexion = datetime.utcnow()
        if "estado" in dispositivo:
            existente.estado = dispositivo["estado"]
        db.commit()
        return {"mensaje": "Dispositivo actualizado", "id": str(existente.id)}

    nuevo = Dispositivo(
        imei=dispositivo.get("imei"),
        serial=dispositivo.get("serial"),
        modelo=dispositivo.get("modelo"),
        fabricante=dispositivo.get("fabricante"),
        android=dispositivo.get("android"),
        sede=dispositivo.get("sede", "Sin sede"),
        estado=dispositivo.get("estado", "activo"),
        device_owner=dispositivo.get("deviceOwner", False),
        colaborador=dispositivo.get("colaborador"),
        politicas=dispositivo.get("politicas", POLITICAS_DEFAULT),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Dispositivo registrado", "id": str(nuevo.id)}
