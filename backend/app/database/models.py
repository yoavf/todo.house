"""SQLAlchemy ORM models."""

from datetime import datetime
from typing import List, Optional
import uuid
from sqlalchemy import String, DateTime, Integer, Boolean, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator

from ..models import TaskStatus, TaskPriority, TaskSource


class JSONType(TypeDecorator):
    """
    Cross-database JSON column type for SQLAlchemy models.

    This type decorator automatically uses the PostgreSQL `JSONB` type when connected to a PostgreSQL
    database, and falls back to the generic `JSON` type for other databases (such as SQLite or MySQL).
    This ensures that your models can store and query JSON data efficiently and portably across
    different database backends.

    - `JSONB` (PostgreSQL): Stores JSON data in a decomposed binary format, allowing for efficient
      indexing and advanced querying. Recommended for production use with PostgreSQL.
    - `JSON` (Other DBs): Stores JSON data as plain text. Supported by most modern databases, but
      may have limited indexing/query capabilities compared to `JSONB`.

    Usage example:

        from sqlalchemy.orm import Mapped, mapped_column
        from .models import JSONType

        class MyModel(Base):
            __tablename__ = "my_model"
            id: Mapped[int] = mapped_column(primary_key=True)
            data: Mapped[dict] = mapped_column(JSONType, nullable=True)

    Notes:
        - Use this type for columns that need to store arbitrary JSON data and require compatibility
          across different database engines.
        - For PostgreSQL, `JSONB` is preferred over `JSON` due to better performance and features.
        - For lists of strings or other simple arrays, consider using the native ARRAY type if supported.
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    # Common columns for all tables
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class User(Base):
    """User model."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    # Relationships
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="user")
    images: Mapped[List["Image"]] = relationship("Image", back_populates="user")
    locations: Mapped[List["Location"]] = relationship(
        "Location", back_populates="user"
    )


class Location(Base):
    """Location model for user-specific locations."""

    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    location_metadata: Mapped[Optional[dict]] = mapped_column(JSONType, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="locations")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="location")


class Task(Base):
    """Task model with flexible content, metrics, and scheduling support."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(
        String(20), default=TaskPriority.MEDIUM.value, nullable=False
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=TaskStatus.ACTIVE.value, nullable=False
    )

    # Enhanced scheduling fields
    snoozed_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    schedule: Mapped[Optional[dict]] = mapped_column(JSONType, nullable=True)
    show_after: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Flexible content and metrics
    content: Mapped[Optional[dict]] = mapped_column(JSONType, nullable=True)
    metrics: Mapped[Optional[dict]] = mapped_column(JSONType, nullable=True)

    # AI and source tracking
    source: Mapped[str] = mapped_column(
        String(20), default=TaskSource.MANUAL.value, nullable=False
    )
    source_image_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    ai_confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    ai_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Categorization
    task_types: Mapped[Optional[List[str]]] = mapped_column(
        JSON, nullable=True, default=list
    )
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    # Location reference
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    location: Mapped[Optional["Location"]] = relationship(
        "Location", back_populates="tasks"
    )


class Image(Base):
    """Image model."""

    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    analysis_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )
    analysis_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="images")
