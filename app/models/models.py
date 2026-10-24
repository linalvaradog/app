from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Perfil(Base):
    __tablename__ = "perfiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    apps_ocultar = Column(JSON, default=list)
    apps_proteger = Column(JSON, default=list)
    restricciones = Column(JSON, default=dict)
    bloqueo_auto_minutos = Column(Integer, default=3)
    creado_en = Column(DateTime, default=datetime.utcnow)

    tokens = relationship("TokenEnrolamiento", back_populates="perfil")


class TokenEnrolamiento(Base):
    __tablename__ = "tokens_enrolamiento"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(36), unique=True, nullable=False, index=True)
    sede = Column(Text, nullable=False)
    perfil_id = Column(Integer, ForeignKey("perfiles.id"), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    expira_en = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False)
    dispositivo_imei = Column(Text, nullable=True)

    perfil = relationship("Perfil", back_populates="tokens")


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


class ColaboradorLocal(Base):
    """Colaboradores agregados manualmente (sin cuenta Azure AD / InvGate)"""
    __tablename__ = "colaboradores_locales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dni = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    puesto = Column(String(200), nullable=True)
    sede = Column(String(200), nullable=True)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    nombre = Column(String(200))
    rol = Column(String(50), default="admin")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
