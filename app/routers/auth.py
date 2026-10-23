from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

from app.database import get_db
from app.models.models import Usuario

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "grupopalmas-mdm-secret-2026")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.username == request.username,
        Usuario.activo == True
    ).first()

    if not usuario or not pwd_context.verify(request.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    payload = {
        "sub": usuario.username,
        "rol": usuario.rol,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return LoginResponse(token=token, username=usuario.username)
