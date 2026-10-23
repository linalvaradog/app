import paho.mqtt.client as mqtt
import json
import asyncio
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER = os.getenv("MQTT_USER", "mdm-server")
MQTT_PASS = os.getenv("MQTT_PASS", "GrupopalmasMQTT2026")

TOPIC_ESTADO = "palmas/dispositivos/+/estado"
TOPIC_ALERTA = "palmas/dispositivos/+/alerta"

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado a Mosquitto MQTT")
        client.subscribe(TOPIC_ESTADO)
        client.subscribe(TOPIC_ALERTA)
    else:
        print(f"❌ Error de conexión MQTT: {reason_code}")


def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        print(f"📨 Mensaje MQTT — Tópico: {topic} | Datos: {payload}")

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
        print(f"Error notificando panel WebSocket: {e}")


def actualizar_estado_dispositivo(device_id: str, payload: dict):
    from app.database import SessionLocal
    from app.models.models import Dispositivo

    db = SessionLocal()
    try:
        imei = payload.get("imei", device_id)
        dispositivo = db.query(Dispositivo).filter(
            (Dispositivo.imei == imei) | (Dispositivo.id == device_id)
        ).first()

        if dispositivo:
            dispositivo.ultima_conexion = datetime.utcnow()
            if "estado" in payload:
                dispositivo.estado = payload["estado"]
            print(f"✅ Estado actualizado — {dispositivo.fabricante} {dispositivo.modelo} (IMEI: {imei})")
        else:
            nuevo = Dispositivo(
                id=str(uuid.uuid4()),
                imei=imei,
                serial=payload.get("serial", "Desconocido"),
                modelo=payload.get("modelo", "Desconocido"),
                fabricante=payload.get("fabricante", "Desconocido"),
                android=payload.get("android", "Desconocido"),
                sede=payload.get("sede", "Sin sede configurada"),
                estado=payload.get("estado", "activo"),
                device_owner=payload.get("deviceOwner", False),
                colaborador=payload.get("colaborador"),
                politicas={
                    "instalacionBloqueada": True,
                    "factoryResetBloqueado": True,
                    "usbDebuggingBloqueado": True,
                    "pinRequerido": True,
                },
            )
            db.add(nuevo)
            print(f"📱 Nuevo dispositivo registrado — {payload.get('fabricante','?')} {payload.get('modelo','?')} (IMEI: {imei})")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error actualizando dispositivo en DB: {e}")
    finally:
        db.close()


def registrar_alerta_dispositivo(device_id: str, payload: dict):
    from app.database import SessionLocal
    from app.models.models import Alerta, Dispositivo

    db = SessionLocal()
    try:
        imei = payload.get("imei", device_id)
        dispositivo = db.query(Dispositivo).filter(
            (Dispositivo.imei == imei) | (Dispositivo.id == device_id)
        ).first()

        alerta = Alerta(
            id=str(uuid.uuid4()),
            dispositivo_id=dispositivo.id if dispositivo else None,
            tipo=payload.get("tipo", "desconocido"),
            mensaje=payload.get("mensaje", "Alerta sin descripción"),
            fecha=datetime.utcnow(),
            leida=False,
        )
        db.add(alerta)
        db.commit()
        print(f"🚨 Alerta registrada — IMEI: {imei}: {alerta.mensaje}")
    except Exception as e:
        db.rollback()
        print(f"Error registrando alerta en DB: {e}")
    finally:
        db.close()


def enviar_comando_mqtt(imei: str, comando: str):
    topic = f"palmas/dispositivos/{imei}/comando"
    payload = json.dumps({"comando": comando, "timestamp": datetime.utcnow().isoformat()})
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
