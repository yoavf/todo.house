from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class TaskStatus(str, Enum):
    ACTIVE = "active"
    SNOOZED = "snoozed"
    COMPLETED = "completed"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskSource(str, Enum):
    MANUAL = "manual"
    AI_GENERATED = "ai_generated"


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: TaskPriority = TaskPriority.MEDIUM
    completed: bool = False
    status: TaskStatus = TaskStatus.ACTIVE
    snoozed_until: Optional[datetime] = None


class TaskCreate(TaskBase):
    source: TaskSource = TaskSource.MANUAL
    source_image_id: Optional[str] = None
    ai_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    ai_provider: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[TaskPriority] = None
    completed: Optional[bool] = None
    status: Optional[TaskStatus] = None
    snoozed_until: Optional[datetime] = None


class Task(TaskBase):
    id: int
    user_id: str
    source: TaskSource = TaskSource.MANUAL
    source_image_id: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SnoozeRequest(BaseModel):
    snooze_until: Optional[datetime] = None


class AITaskCreate(TaskCreate):
    """Special model for AI-generated task creation with required AI fields"""
    source: TaskSource = Field(TaskSource.AI_GENERATED, const=True)
    source_image_id: str = Field(..., description="UUID of the source image")
    ai_confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score")
    ai_provider: str = Field(..., description="AI provider that generated this task")