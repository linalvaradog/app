from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Dispositivo(Base):
    __tablename__ = "dispositivos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    imei = Column(Text, unique=True, nullable=False, index=True)
    serial = Column(Text)
    modelo = Column(Text)
    fabricante = Column(Text)
    android = Column(Text)
    sede = Column(Text)
    device_owner = Column(Boolean, default=False)
    estado = Column(Text, default="activo")
    ultima_conexion = Column(DateTime, default=datetime.utcnow)
    colaborador = Column(JSON, nullable=True)
    politicas = Column(JSON, default=lambda: {
        "instalacionBloqueada": True,
        "factoryResetBloqueado": True,
        "usbDebuggingBloqueado": True,
        "pinRequerido": True,
    })

    alertas = relationship("Alerta", back_populates="dispositivo", cascade="all, delete-orphan")
    actividades = relationship("Actividad", back_populates="dispositivo", cascade="all, delete-orphan")


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=True)
    tipo = Column(Text, nullable=False)
    mensaje = Column(Text)
    fecha = Column(DateTime, default=datetime.utcnow)
    leida = Column(Boolean, default=False)

    dispositivo = relationship("Dispositivo", back_populates="alertas")


class Actividad(Base):
    __tablename__ = "actividad"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=True)
    imei = Column(Text, nullable=False)
    evento = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    dispositivo = relationship("Dispositivo", back_populates="actividades")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    nombre = Column(String(200))
    rol = Column(String(50), default="admin")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
