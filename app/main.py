from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine
from app.models.models import Base
from app.routers import auth, dispositivos, alertas, dashboard
from app.routers.websocket import router as ws_router
from app.mqtt import iniciar_mqtt

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    iniciar_mqtt()
    yield


app = FastAPI(
    title="Grupo Palmas MDM API",
    description="Sistema de Gestión de Dispositivos Móviles",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(dispositivos.router, prefix="/dispositivos", tags=["Dispositivos"])
app.include_router(alertas.router, prefix="/alertas", tags=["Alertas"])
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/")
def root():
    return {"mensaje": "Grupo Palmas MDM API v1.0", "estado": "activo"}
