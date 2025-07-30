"""SQLAlchemy ORM models."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, Integer, Boolean, Text, JSON, Enum, ForeignKey
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from ..models import TaskStatus, TaskPriority, TaskSource


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    # Common columns for all tables
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class User(Base):
    """User model."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    
    # Relationships
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="user")
    images: Mapped[List["Image"]] = relationship("Image", back_populates="user")


class Task(Base):
    """Task model."""
    
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), 
        default=TaskPriority.MEDIUM,
        nullable=False
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), 
        default=TaskStatus.ACTIVE,
        nullable=False
    )
    snoozed_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[TaskSource] = mapped_column(
        Enum(TaskSource), 
        default=TaskSource.MANUAL,
        nullable=False
    )
    source_image_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    ai_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    task_types: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=list)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")


class Image(Base):
    """Image model."""
    
    __tablename__ = "images"
    
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    analysis_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    analysis_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="images")