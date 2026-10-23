from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt

router = APIRouter()

SECRET_KEY = "grupopalmas-mdm-secret-2026"
ALGORITHM = "HS256"

USUARIOS = {
    "admin": "GrupopalmasTI2024"
}

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    password = USUARIOS.get(request.username)
    if not password or password != request.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    payload = {
        "sub": request.username,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return LoginResponse(token=token, username=request.username)