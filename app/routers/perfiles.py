from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Perfil, Dispositivo

router = APIRouter()


def perfil_a_dict(p: Perfil) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion or "",
        "apps_ocultar": p.apps_ocultar or [],
        "apps_proteger": p.apps_proteger or [],
        "restricciones": p.restricciones or {},
        "bloqueo_auto_minutos": p.bloqueo_auto_minutos or 3,
        "dispositivos_asignados": len(p.tokens) if p.tokens else 0,
        "creado_en": p.creado_en.isoformat(),
    }


@router.get("")
def listar_perfiles(db: Session = Depends(get_db)):
    return [perfil_a_dict(p) for p in db.query(Perfil).all()]


@router.post("")
def crear_perfil(body: dict, db: Session = Depends(get_db)):
    p = Perfil(
        nombre=body.get("nombre"),
        descripcion=body.get("descripcion", ""),
        apps_ocultar=body.get("apps_ocultar", []),
        apps_proteger=body.get("apps_proteger", []),
        restricciones=body.get("restricciones", {}),
        bloqueo_auto_minutos=body.get("bloqueo_auto_minutos", 3),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return perfil_a_dict(p)


@router.put("/{id}")
def actualizar_perfil(id: int, body: dict, db: Session = Depends(get_db)):
    p = db.query(Perfil).filter(Perfil.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    p.nombre = body.get("nombre", p.nombre)
    p.descripcion = body.get("descripcion", p.descripcion)
    p.apps_ocultar = body.get("apps_ocultar", p.apps_ocultar)
    p.apps_proteger = body.get("apps_proteger", p.apps_proteger)
    p.restricciones = body.get("restricciones", p.restricciones)
    p.bloqueo_auto_minutos = body.get("bloqueo_auto_minutos", p.bloqueo_auto_minutos)
    db.commit()
    return perfil_a_dict(p)


@router.delete("/{id}")
def eliminar_perfil(id: int, db: Session = Depends(get_db)):
    p = db.query(Perfil).filter(Perfil.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    db.delete(p)
    db.commit()
    return {"mensaje": "Perfil eliminado"}


@router.post("/{id}/aplicar/{dispositivo_id}")
def aplicar_perfil(id: int, dispositivo_id: int, db: Session = Depends(get_db)):
    from app.mqtt import enviar_comando_mqtt
    p = db.query(Perfil).filter(Perfil.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    d = db.query(Dispositivo).filter(Dispositivo.id == dispositivo_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    d.politicas = {
        "restricciones": p.restricciones,
        "apps_ocultar": p.apps_ocultar,
        "apps_proteger": p.apps_proteger,
        "bloqueo_auto_minutos": p.bloqueo_auto_minutos,
        "instalacionBloqueada": p.restricciones.get("instalacionBloqueada", True),
        "factoryResetBloqueado": p.restricciones.get("factoryResetBloqueado", True),
        "usbDebuggingBloqueado": p.restricciones.get("usbDebuggingBloqueado", False),
        "pinRequerido": p.restricciones.get("pinRequerido", True),
    }
    db.commit()
    enviar_comando_mqtt(d.imei, "refresh")
    return {"mensaje": f"Perfil '{p.nombre}' aplicado al dispositivo"}
