"""Alembic environment configuration."""

import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import create_engine
from alembic import context
import os
import sys

# Add the parent directory to Python path so we can import our app
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database.models import Base
from app.config import config as app_config

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url():
    """Get the database URL from environment variables."""
    database_url = app_config.database.database_url
    
    # Fix database URL for async PostgreSQL if needed (same as in engine.py)
    if database_url.startswith("postgresql://"):
        # Convert to async PostgreSQL URL for asyncpg
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    elif database_url.startswith("postgres://"):
        # Handle older Heroku-style postgres:// URLs
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://")
    
    return database_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    # Convert async SQLite URL to sync if needed
    if url.startswith("sqlite") and "+aiosqlite" in url:
        url = url.replace("+aiosqlite", "")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    connectable = create_async_engine(
        get_database_url(),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    database_url = get_database_url()

    # Check if we're using SQLite
    if database_url.startswith("sqlite"):
        # Convert async SQLite URL to sync if needed
        if "+aiosqlite" in database_url:
            database_url = database_url.replace("+aiosqlite", "")
        # For SQLite, use synchronous engine
        connectable = create_engine(
            database_url,
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)

            with context.begin_transaction():
                context.run_migrations()
    else:
        # For other databases, use async engine
        asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
