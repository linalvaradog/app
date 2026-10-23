"""
Crea las tablas y el usuario admin inicial.
Ejecutar una sola vez: python scripts/init_db.py
"""
import sys
import os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models.models import Base, Usuario
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas")

db = SessionLocal()
try:
    if not db.query(Usuario).filter(Usuario.username == "admin").first():
        password = os.getenv("ADMIN_PASSWORD", "GrupopalmasTI2024")
        admin = Usuario(
            username="admin",
            password_hash=pwd_context.hash(password),
            nombre="Administrador TI",
            rol="admin",
            activo=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Usuario admin creado")
    else:
        print("ℹ️  Usuario admin ya existe")
finally:
    db.close()

print("✅ Base de datos lista")
