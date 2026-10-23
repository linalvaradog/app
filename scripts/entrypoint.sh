#!/bin/bash
set -e

echo "Inicializando base de datos..."
python scripts/init_db.py

echo "Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8084
