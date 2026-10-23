from fastapi import APIRouter, HTTPException
from datetime import datetime

router = APIRouter()

dispositivos_db = [
    {
        "id": "1",
        "imei": "356253244400797",
        "serial": "R8YL610L9XY",
        "modelo": "SM-A075M",
        "fabricante": "Samsung",
        "android": "Android 16",
        "sede": "Tulumayo",
        "estado": "activo",
        "deviceOwner": True,
        "ultimaConexion": "2026-10-20 10:30",
        "colaborador": {
            "nombre": "Juan Pérez",
            "dni": "12345678",
            "area": "Operaciones",
            "puesto": "Técnico"
        },
        "politicas": {
            "instalacionBloqueada": True,
            "factoryResetBloqueado": True,
            "usbDebuggingBloqueado": True,
            "pinRequerido": True
        }
    },
    {
        "id": "2",
        "imei": "123456789012345",
        "serial": "ABC123XYZ",
        "modelo": "Moto E30",
        "fabricante": "Motorola",
        "android": "Android 11",
        "sede": "Shanusi",
        "estado": "activo",
        "deviceOwner": True,
        "ultimaConexion": "2026-10-20 09:15",
        "colaborador": {
            "nombre": "María López",
            "dni": "87654321",
            "area": "Logística",
            "puesto": "Coordinadora"
        },
        "politicas": {
            "instalacionBloqueada": True,
            "factoryResetBloqueado": True,
            "usbDebuggingBloqueado": False,
            "pinRequerido": True
        }
    },
    {
        "id": "3",
        "imei": "355447171823457",
        "serial": "ZY32FWG8P9",
        "modelo": "Moto E30",
        "fabricante": "Motorola",
        "android": "Android 11",
        "sede": "Tulumayo",
        "estado": "activo",
        "deviceOwner": True,
        "ultimaConexion": "2026-10-20 16:25",
        "colaborador": None,
        "politicas": {
            "instalacionBloqueada": True,
            "factoryResetBloqueado": True,
            "usbDebuggingBloqueado": True,
            "pinRequerido": True
        }
    }
]

@router.get("/")
def get_dispositivos():
    return dispositivos_db

@router.get("/{id}")
def get_dispositivo(id: str):
    dispositivo = next((d for d in dispositivos_db if d["id"] == id), None)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return dispositivo

@router.post("/{id}/bloquear")
def bloquear_dispositivo(id: str):
    from app.mqtt import enviar_comando_mqtt
    dispositivo = next((d for d in dispositivos_db if d["id"] == id), None)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    dispositivo["estado"] = "bloqueado"
    enviar_comando_mqtt(dispositivo["imei"], "lock")
    return {"mensaje": "Dispositivo bloqueado correctamente"}

@router.post("/{id}/desbloquear")
def desbloquear_dispositivo(id: str):
    dispositivo = next((d for d in dispositivos_db if d["id"] == id), None)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    dispositivo["estado"] = "activo"
    return {"mensaje": "Dispositivo desbloqueado correctamente"}

@router.post("/{id}/borrar")
def borrar_dispositivo(id: str):
    from app.mqtt import enviar_comando_mqtt
    dispositivo = next((d for d in dispositivos_db if d["id"] == id), None)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    enviar_comando_mqtt(dispositivo["imei"], "wipe")
    return {"mensaje": "Comando de borrado enviado al dispositivo"}

@router.post("/{id}/comando")
def enviar_comando(id: str, body: dict):
    from app.mqtt import enviar_comando_mqtt
    dispositivo = next((d for d in dispositivos_db if d["id"] == id), None)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    comando = body.get("comando")
    enviar_comando_mqtt(dispositivo["imei"], comando)
    return {"mensaje": f"Comando '{comando}' enviado al dispositivo"}

@router.post("/registrar")
def registrar_dispositivo(dispositivo: dict):
    dispositivo["id"] = str(len(dispositivos_db) + 1)
    dispositivo["ultimaConexion"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    dispositivos_db.append(dispositivo)
    return {"mensaje": "Dispositivo registrado", "id": dispositivo["id"]}