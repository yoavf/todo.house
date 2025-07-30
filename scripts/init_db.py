#!/usr/bin/env python3
"""Initialize database tables if no migrations exist."""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database.base import Base
from app.database import engine


async def init_db():
    """Create all tables defined in the models."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully")


if __name__ == "__main__":
    asyncio.run(init_db())