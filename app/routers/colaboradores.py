import httpx
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.models import ColaboradorLocal

router = APIRouter()

INVGATE_URL = os.getenv("INVGATE_URL", "https://grupopalmas.is.cloud.invgate.net")
INVGATE_CLIENT_ID = os.getenv("INVGATE_CLIENT_ID", "")
INVGATE_CLIENT_SECRET = os.getenv("INVGATE_CLIENT_SECRET", "")

_token_cache: dict = {}


async def get_invgate_token() -> str:
    now = datetime.utcnow().timestamp()
    if _token_cache.get("token") and _token_cache.get("expires_at", 0) > now + 60:
        return _token_cache["token"]

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{INVGATE_URL}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": INVGATE_CLIENT_ID,
                "client_secret": INVGATE_CLIENT_SECRET,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"InvGate auth error: {resp.text}")
        data = resp.json()
        _token_cache["token"] = data["access_token"]
        _token_cache["expires_at"] = now + data.get("expires_in", 3600)
        return _token_cache["token"]


async def fetch_invgate_users() -> list[dict]:
    token = await get_invgate_token()
    results = []
    page = 1
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            resp = await client.get(
                f"{INVGATE_URL}/api/v1/people",
                headers={"Authorization": f"Bearer {token}"},
                params={"page": page, "per_page": 100, "active": "true"},
            )
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data if isinstance(data, list) else data.get("results", data.get("data", []))
            if not items:
                break
            for u in items:
                results.append({
                    "id": u.get("id"),
                    "dni": u.get("identification_number") or u.get("dni") or "",
                    "nombre": u.get("name") or f"{u.get('first_name','')} {u.get('last_name','')}".strip(),
                    "puesto": u.get("position") or u.get("title") or "",
                    "sede": u.get("location") or u.get("department") or "",
                    "email": u.get("email") or "",
                    "fuente": "invgate",
                })
            if len(items) < 100:
                break
            page += 1
    return results


@router.get("")
async def listar_colaboradores(db: Session = Depends(get_db)):
    locales = db.query(ColaboradorLocal).filter(ColaboradorLocal.activo == True).all()
    locales_list = [
        {
            "id": f"local-{c.id}",
            "dni": c.dni,
            "nombre": c.nombre,
            "puesto": c.puesto or "",
            "sede": c.sede or "",
            "email": "",
            "fuente": "local",
        }
        for c in locales
    ]

    try:
        invgate_users = await fetch_invgate_users()
    except Exception:
        invgate_users = []

    return {"invgate": invgate_users, "locales": locales_list}


@router.post("")
async def crear_colaborador_local(body: dict, db: Session = Depends(get_db)):
    dni = body.get("dni", "").strip()
    nombre = body.get("nombre", "").strip()
    if not dni or not nombre:
        raise HTTPException(status_code=400, detail="DNI y nombre son requeridos")

    existente = db.query(ColaboradorLocal).filter(ColaboradorLocal.dni == dni).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un colaborador con ese DNI")

    c = ColaboradorLocal(
        dni=dni,
        nombre=nombre,
        puesto=body.get("puesto", ""),
        sede=body.get("sede", ""),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": f"local-{c.id}", "dni": c.dni, "nombre": c.nombre,
            "puesto": c.puesto, "sede": c.sede, "fuente": "local"}


@router.delete("/{id}")
def eliminar_colaborador_local(id: int, db: Session = Depends(get_db)):
    c = db.query(ColaboradorLocal).filter(ColaboradorLocal.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    c.activo = False
    db.commit()
    return {"mensaje": "Colaborador eliminado"}
