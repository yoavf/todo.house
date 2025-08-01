"""Database layer - exports SQLAlchemy components."""

# SQLAlchemy imports
from .database.session import get_session, get_session_dependency
from .database.engine import get_engine
from .database.models import Base, User, Task, Image

# Re-export SQLAlchemy components for easy access
__all__ = [
    # SQLAlchemy session management
    "get_session",
    "get_session_dependency",
    "get_engine",
    # SQLAlchemy models
    "Base",
    "User",
    "Task",
    "Image",
]
