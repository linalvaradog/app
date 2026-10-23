from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.models.models import Alerta

router = APIRouter()


def alerta_a_dict(a: Alerta) -> dict:
    return {
        "id": a.id,
        "dispositivoId": a.dispositivo_id,
        "tipo": a.tipo,
        "mensaje": a.mensaje,
        "fecha": a.fecha.strftime("%Y-%m-%d %H:%M") if a.fecha else None,
        "leida": a.leida,
    }


@router.get("/")
def get_alertas(db: Session = Depends(get_db)):
    return [alerta_a_dict(a) for a in db.query(Alerta).order_by(Alerta.fecha.desc()).all()]


@router.put("/{id}/leida")
def marcar_leida(id: str, db: Session = Depends(get_db)):
    a = db.query(Alerta).filter(Alerta.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    a.leida = True
    db.commit()
    return {"mensaje": f"Alerta {id} marcada como leída"}


@router.post("/registrar")
def registrar_alerta(alerta: dict, db: Session = Depends(get_db)):
    nueva = Alerta(
        id=str(uuid.uuid4()),
        dispositivo_id=alerta.get("dispositivoId"),
        tipo=alerta.get("tipo", "desconocido"),
        mensaje=alerta.get("mensaje", ""),
        fecha=datetime.utcnow(),
        leida=False,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "Alerta registrada", "id": nueva.id}
