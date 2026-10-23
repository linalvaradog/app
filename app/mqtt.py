import paho.mqtt.client as mqtt
import json
import asyncio
from datetime import datetime

MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_USER = "mdm-server"
MQTT_PASS = "GrupopalmasMQTT2026"

TOPIC_ESTADO = "palmas/dispositivos/+/estado"
TOPIC_ALERTA = "palmas/dispositivos/+/alerta"

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado a Mosquitto MQTT")
        client.subscribe(TOPIC_ESTADO)
        client.subscribe(TOPIC_ALERTA)
    else:
        print(f"❌ Error de conexión: {reason_code}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        print(f"📨 Mensaje recibido — Tópico: {topic} | Datos: {payload}")

        partes = topic.split("/")
        device_id = partes[2]
        tipo = partes[3]

        if tipo == "estado":
            actualizar_estado_dispositivo(device_id, payload)
            notificar_panel("dispositivo_actualizado", payload)
        elif tipo == "alerta":
            registrar_alerta_dispositivo(device_id, payload)
            notificar_panel("nueva_alerta", payload)

    except Exception as e:
        print(f"Error procesando mensaje MQTT: {e}")

def notificar_panel(evento: str, datos: dict):
    try:
        from app.routers.websocket import manager
        mensaje = {"evento": evento, "datos": datos}
        loop = asyncio.new_event_loop()
        loop.run_until_complete(manager.broadcast(mensaje))
        loop.close()
    except Exception as e:
        print(f"Error notificando panel: {e}")

def actualizar_estado_dispositivo(device_id: str, payload: dict):
    from app.routers.dispositivos import dispositivos_db

    imei = payload.get("imei", device_id)
    dispositivo = next(
        (d for d in dispositivos_db if d["imei"] == imei or d["id"] == device_id),
        None
    )

    if dispositivo:
        dispositivo["ultimaConexion"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        if "estado" in payload:
            dispositivo["estado"] = payload["estado"]
        print(f"✅ Estado actualizado — {dispositivo['fabricante']} {dispositivo['modelo']} (IMEI: {imei})")
    else:
        nuevo = {
            "id": str(len(dispositivos_db) + 1),
            "imei": imei,
            "serial": payload.get("serial", "Desconocido"),
            "modelo": payload.get("modelo", "Desconocido"),
            "fabricante": payload.get("fabricante", "Desconocido"),
            "android": payload.get("android", "Desconocido"),
            "sede": payload.get("sede", "Sin sede configurada"),
            "estado": payload.get("estado", "activo"),
            "deviceOwner": payload.get("deviceOwner", False),
            "ultimaConexion": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "colaborador": payload.get("colaborador", None),
            "politicas": {
                "instalacionBloqueada": True,
                "factoryResetBloqueado": True,
                "usbDebuggingBloqueado": True,
                "pinRequerido": True
            }
        }
        dispositivos_db.append(nuevo)
        print(f"📱 Nuevo dispositivo registrado — {payload.get('fabricante','?')} {payload.get('modelo','?')} (IMEI: {imei})")

def registrar_alerta_dispositivo(device_id: str, payload: dict):
    from app.routers.alertas import alertas_db
    from app.routers.dispositivos import dispositivos_db

    imei = payload.get("imei", device_id)
    dispositivo = next(
        (d for d in dispositivos_db if d["imei"] == imei or d["id"] == device_id),
        None
    )

    alerta = {
        "id": str(len(alertas_db) + 1),
        "dispositivoId": dispositivo["id"] if dispositivo else device_id,
        "tipo": payload.get("tipo", "desconocido"),
        "mensaje": payload.get("mensaje", "Alerta sin descripción"),
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "leida": False
    }
    alertas_db.append(alerta)
    print(f"🚨 Alerta registrada — IMEI: {imei}: {alerta['mensaje']}")

def enviar_comando_mqtt(imei: str, comando: str):
    topic = f"palmas/dispositivos/{imei}/comando"
    payload = json.dumps({"comando": comando, "timestamp": datetime.now().isoformat()})
    client.publish(topic, payload)
    print(f"📤 Comando enviado — IMEI: {imei}: {comando}")

def iniciar_mqtt():
    try:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(MQTT_HOST, MQTT_PORT, 60)
        client.loop_start()
        print("🚀 Cliente MQTT iniciado")
    except Exception as e:
        print(f"❌ Error iniciando MQTT: {e}")