from datetime import datetime
from typing import Optional, Literal, List, Dict, Any
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

    source: Literal[TaskSource.AI_GENERATED] = TaskSource.AI_GENERATED
    source_image_id: str = Field(..., description="UUID of the source image")
    ai_confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score")
    ai_provider: str = Field(..., description="AI provider that generated this task")


# Image analysis models
class GeneratedTask(BaseModel):
    """Model for a task generated from AI image analysis"""

    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=1000)
    priority: TaskPriority
    category: str = Field(..., max_length=100)
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis endpoint"""

    image_id: Optional[str] = Field(None, description="UUID of stored image")
    tasks: List[GeneratedTask] = Field(default_factory=list)
    analysis_summary: str = Field(
        ..., description="Summary of what was observed in the image"
    )
    processing_time: float = Field(
        ..., description="Time taken to process the image in seconds"
    )
    provider_used: str = Field(..., description="AI provider used for analysis")
    image_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Image metadata"
    )
    retry_count: int = Field(default=0, description="Number of retries performed")


class ImageAnalysisError(BaseModel):
    """Error response model for image analysis"""

    error_code: str = Field(..., description="Error code identifier")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(
        None, description="Additional error details"
    )
    retry_after: Optional[int] = Field(
        None, description="Seconds to wait before retrying"
    )
