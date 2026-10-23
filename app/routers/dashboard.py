from fastapi import APIRouter

router = APIRouter()

# Datos compartidos — luego migraremos a PostgreSQL
dispositivos_db = []
alertas_db = []

def set_data(disp, alert):
    global dispositivos_db, alertas_db
    dispositivos_db = disp
    alertas_db = alert

@router.get("/")
def get_dashboard():
    from app.routers.dispositivos import dispositivos_db
    from app.routers.alertas import alertas_db

    total = len(dispositivos_db)
    activos = len([d for d in dispositivos_db if d["estado"] == "activo"])
    inactivos = len([d for d in dispositivos_db if d["estado"] == "inactivo"])
    bloqueados = len([d for d in dispositivos_db if d["estado"] == "bloqueado"])
    alertas_pendientes = len([a for a in alertas_db if not a["leida"]])

    sedes = {}
    for d in dispositivos_db:
        sede = d["sede"]
        sedes[sede] = sedes.get(sede, 0) + 1

    dispositivos_por_sede = [
        {"sede": sede, "cantidad": cantidad}
        for sede, cantidad in sedes.items()
    ]

    return {
        "totalDispositivos": total,
        "dispositivosActivos": activos,
        "dispositivosInactivos": inactivos,
        "dispositivosBloqueados": bloqueados,
        "alertasPendientes": alertas_pendientes,
        "dispositivosPorSede": dispositivos_por_sede
    }