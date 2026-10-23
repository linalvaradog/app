from fastapi import APIRouter, HTTPException
from datetime import datetime

router = APIRouter()

alertas_db = [
    {
        "id": "1",
        "dispositivoId": "1",
        "tipo": "instalacion",
        "mensaje": "Intento de instalación detectado en Samsung SM-A075M — Tulumayo",
        "fecha": "2026-10-20 10:45",
        "leida": False
    },
    {
        "id": "2",
        "dispositivoId": "2",
        "tipo": "acceso_admin",
        "mensaje": "Acceso al panel de administrador en Moto E30 — Shanusi",
        "fecha": "2026-10-20 09:30",
        "leida": False
    },
    {
        "id": "3",
        "dispositivoId": "1",
        "tipo": "depuracion",
        "mensaje": "Depuración USB detectada en Samsung SM-A075M — Tulumayo",
        "fecha": "2026-10-19 16:20",
        "leida": True
    },
    {
        "id": "4",
        "dispositivoId": "3",
        "tipo": "root",
        "mensaje": "Root detectado en dispositivo ZTE Z2450 — Palmawasi",
        "fecha": "2026-10-19 14:10",
        "leida": True
    }
]

@router.get("/")
def get_alertas():
    return alertas_db

@router.put("/{id}/leida")
def marcar_leida(id: str):
    alerta = next((a for a in alertas_db if a["id"] == id), None)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta["leida"] = True
    return {"mensaje": f"Alerta {id} marcada como leída"}

@router.post("/registrar")
def registrar_alerta(alerta: dict):
    alerta["id"] = str(len(alertas_db) + 1)
    alerta["fecha"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    alerta["leida"] = False
    alertas_db.append(alerta)
    return {"mensaje": "Alerta registrada", "id": alerta["id"]}