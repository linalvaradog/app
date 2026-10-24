from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import Dispositivo, Actividad

router = APIRouter()


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    total = db.query(Dispositivo).count()
    activos = db.query(Dispositivo).filter(Dispositivo.estado == "activo").count()
    inactivos = db.query(Dispositivo).filter(Dispositivo.estado == "inactivo").count()
    bloqueados = db.query(Dispositivo).filter(Dispositivo.estado == "bloqueado").count()
    alertas_pendientes = db.query(Actividad).count()

    sedes_raw = db.query(
        Dispositivo.sede, func.count(Dispositivo.id)
    ).group_by(Dispositivo.sede).all()

    dispositivos_por_sede = [
        {"sede": sede or "Sin sede", "cantidad": cantidad}
        for sede, cantidad in sedes_raw
    ]

    return {
        "totalDispositivos": total,
        "dispositivosActivos": activos,
        "dispositivosInactivos": inactivos,
        "dispositivosBloqueados": bloqueados,
        "alertasPendientes": alertas_pendientes,
        "dispositivosPorSede": dispositivos_por_sede,
    }
