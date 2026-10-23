from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Dispositivo(Base):
    __tablename__ = "dispositivos"

    id = Column(String, primary_key=True)
    imei = Column(String, unique=True, nullable=False, index=True)
    serial = Column(String)
    modelo = Column(String)
    fabricante = Column(String)
    android = Column(String)
    sede = Column(String)
    estado = Column(String, default="activo")
    device_owner = Column(Boolean, default=False)
    ultima_conexion = Column(DateTime, default=datetime.utcnow)
    colaborador = Column(JSON, nullable=True)
    politicas = Column(JSON, default={
        "instalacionBloqueada": True,
        "factoryResetBloqueado": True,
        "usbDebuggingBloqueado": True,
        "pinRequerido": True,
    })

    alertas = relationship("Alerta", back_populates="dispositivo")


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(String, primary_key=True)
    dispositivo_id = Column(String, ForeignKey("dispositivos.id"), nullable=True)
    tipo = Column(String)
    mensaje = Column(Text)
    fecha = Column(DateTime, default=datetime.utcnow)
    leida = Column(Boolean, default=False)

    dispositivo = relationship("Dispositivo", back_populates="alertas")


class Usuario(Base):
    __tablename__ = "usuarios"

    username = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)
    nombre = Column(String)
    rol = Column(String, default="operador")
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
