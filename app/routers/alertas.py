from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.database import get_db
from app.models.models import Alerta

router = APIRouter()


def alerta_a_dict(a: Alerta) -> dict:
    return {
        "id": str(a.id),
        "dispositivoId": str(a.dispositivo_id) if a.dispositivo_id else None,
        "tipo": a.tipo,
        "mensaje": a.mensaje,
        "fecha": a.fecha.strftime("%Y-%m-%d %H:%M") if a.fecha else None,
        "leida": a.leida,
    }


@router.get("/")
def get_alertas(db: Session = Depends(get_db)):
    alertas = db.query(Alerta).order_by(desc(Alerta.fecha)).limit(100).all()
    return [alerta_a_dict(a) for a in alertas]


@router.put("/{id}/leida")
def marcar_leida(id: str, db: Session = Depends(get_db)):
    a = db.query(Alerta).filter(Alerta.id == int(id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    a.leida = True
    db.commit()
    return {"mensaje": f"Alerta {id} marcada como leída"}


@router.post("/registrar")
def registrar_alerta(alerta: dict, db: Session = Depends(get_db)):
    nueva = Alerta(
        dispositivo_id=int(alerta["dispositivoId"]) if alerta.get("dispositivoId") else None,
        tipo=alerta.get("tipo", "desconocido"),
        mensaje=alerta.get("mensaje", ""),
        fecha=datetime.utcnow(),
        leida=False,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "Alerta registrada", "id": str(nueva.id)}
