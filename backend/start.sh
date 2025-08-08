#!/usr/bin/env bash
# Start script for Render
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting application..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}