#!/usr/bin/env bash
# Build script for Render
set -e

echo "Installing dependencies..."
pip install uv
uv sync

echo "Running database migrations..."
uv run alembic upgrade head

echo "Build complete!"