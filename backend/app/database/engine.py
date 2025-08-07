"""SQLAlchemy async engine setup."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.pool import NullPool
from sqlalchemy.engine.url import make_url
from ..config import config
import logging

logger = logging.getLogger(__name__)

# Global engine instance
_engine: AsyncEngine | None = None


def create_engine() -> AsyncEngine:
    """
    Create and configure SQLAlchemy async engine.

    Returns:
        Configured async SQLAlchemy engine
    """
    if not config.database.database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # Fix database URL for async PostgreSQL if needed
    database_url = config.database.database_url
    if database_url.startswith("postgresql://"):
        # Convert to async PostgreSQL URL for asyncpg
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        logger.info("Converted PostgreSQL URL to use asyncpg driver")
    elif database_url.startswith("postgres://"):
        # Handle older Heroku-style postgres:// URLs
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://")
        logger.info("Converted postgres:// URL to use asyncpg driver")

    # Check if using SQLite
    is_sqlite = "sqlite" in database_url

    # Create engine with appropriate settings
    engine_kwargs = {
        "echo": config.database.echo,
    }

    if is_sqlite:
        # SQLite doesn't support connection pooling parameters
        engine_kwargs["poolclass"] = NullPool
    else:
        # PostgreSQL/other databases support connection pooling
        engine_kwargs["pool_size"] = config.database.pool_size
        engine_kwargs["max_overflow"] = config.database.max_overflow
        engine_kwargs["pool_pre_ping"] = config.database.pool_pre_ping
        # Use NullPool for testing environments to avoid connection issues
        if "test" in database_url:
            engine_kwargs["poolclass"] = NullPool

    engine = create_async_engine(database_url, **engine_kwargs)

    # Safely log database connection info without exposing credentials
    try:
        url = make_url(database_url)
        # Build a safe representation showing only database type, host, and database name
        safe_url = (
            f"{url.drivername}://***:***@{url.host or 'localhost'}/{url.database or ''}"
        )
        logger.info(f"Created database engine for: {safe_url}")
    except Exception:
        # If URL parsing fails, just log a generic message
        logger.info("Created database engine (credentials masked)")

    return engine


def get_engine() -> AsyncEngine:
    """
    Get the global database engine instance.

    Returns:
        The global async SQLAlchemy engine
    """
    global _engine
    if _engine is None:
        _engine = create_engine()
    return _engine


async def close_engine() -> None:
    """Close the global database engine."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        logger.info("Database engine closed")
