from datetime import datetime
from enum import Enum
import logging
import uuid
from typing import Any, Dict, List, Literal, Optional, TypedDict, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)


class SnoozeOptionData(TypedDict):
    """Type definition for snooze option data."""

    date: datetime
    label: str
    description: str


class EnhancedFieldsMixin:
    """Mixin class for models with schedule and content fields that need JSON serialization."""

    @field_validator("schedule", "content", mode="after")
    @classmethod
    def convert_to_dict(cls, v):
        """Convert Pydantic models to dicts for JSON storage."""
        if v is None:
            return v
        if hasattr(v, "model_dump"):
            # Use mode='json' to ensure enums are serialized as strings
            return v.model_dump(mode="json")
        return v

    @field_validator("schedule", "content", mode="before")
    @classmethod
    def convert_from_dict(cls, v, info):
        """Convert dicts back to Pydantic models when reading from database."""
        if v is None or not isinstance(v, dict):
            return v

        field_name = info.field_name

        try:
            if field_name == "schedule":
                schedule_type = v.get("type")
                if schedule_type == ScheduleType.ONCE.value:
                    # Parse ISO format date string if present
                    if isinstance(v.get("date"), str):
                        v = v.copy()
                        v["date"] = datetime.fromisoformat(
                            v["date"].replace("Z", "+00:00")
                        )
                    return OnceSchedule(**v)
                elif schedule_type == ScheduleType.RECURRING.value:
                    # Parse ISO format date string if present
                    if isinstance(v.get("next_occurrence"), str):
                        v = v.copy()
                        v["next_occurrence"] = datetime.fromisoformat(
                            v["next_occurrence"].replace("Z", "+00:00")
                        )
                    return RecurringSchedule(**v)

            elif field_name == "content":
                content_type = v.get("type")
                if content_type == ContentType.HOW_TO_GUIDE.value:
                    return HowToContent(**v)
                elif content_type == ContentType.CHECKLIST.value:
                    return ChecklistContent(**v)
                elif content_type == ContentType.SHOPPING_LIST.value:
                    return ShoppingListContent(**v)
        except Exception as e:
            logger.debug(f"Could not deserialize {field_name}: {e}")
            # Return the dict as-is if deserialization fails
            return v

        return v


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


class TaskType(str, Enum):
    INTERIOR = "interior"
    EXTERIOR = "exterior"
    ELECTRICITY = "electricity"
    PLUMBING = "plumbing"
    APPLIANCES = "appliances"
    MAINTENANCE = "maintenance"
    REPAIR = "repair"


# Content type models
class ContentType(str, Enum):
    HOW_TO_GUIDE = "how_to_guide"
    CHECKLIST = "checklist"
    SHOPPING_LIST = "shopping_list"
    NOTE = "note"
    REFERENCE = "reference"


class HowToContent(BaseModel):
    type: Literal[ContentType.HOW_TO_GUIDE] = ContentType.HOW_TO_GUIDE
    markdown: str
    images: Optional[List[Dict[str, str]]] = None  # [{"url": "...", "caption": "..."}]
    videos: Optional[List[Dict[str, str]]] = None  # [{"url": "...", "title": "..."}]
    links: Optional[List[Dict[str, str]]] = None  # [{"url": "...", "text": "..."}]


class ChecklistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    completed: bool = False


class ChecklistContent(BaseModel):
    type: Literal[ContentType.CHECKLIST] = ContentType.CHECKLIST
    items: List[ChecklistItem]


class ShoppingListItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    purchased: bool = False


class ShoppingListContent(BaseModel):
    type: Literal[ContentType.SHOPPING_LIST] = ContentType.SHOPPING_LIST
    items: List[ShoppingListItem]
    store: Optional[str] = None
    estimated_cost: Optional[float] = None


# Schedule models
class ScheduleType(str, Enum):
    ONCE = "once"
    RECURRING = "recurring"


class OnceSchedule(BaseModel):
    type: Literal[ScheduleType.ONCE] = ScheduleType.ONCE
    date: datetime


class RecurringPattern(str, Enum):
    INTERVAL = "interval"
    CRON = "cron"
    CUSTOM = "custom"


class RecurringSchedule(BaseModel):
    type: Literal[ScheduleType.RECURRING] = ScheduleType.RECURRING
    pattern: RecurringPattern
    interval_days: Optional[int] = None
    cron: Optional[str] = None
    rules: Optional[Dict[str, Any]] = None
    next_occurrence: Optional[datetime] = None


class TaskBase(BaseModel, EnhancedFieldsMixin):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: TaskPriority = TaskPriority.MEDIUM
    completed: bool = False
    status: TaskStatus = TaskStatus.ACTIVE
    snoozed_until: Optional[datetime] = None
    task_types: List[TaskType] = Field(default_factory=list)

    # Enhanced fields
    schedule: Optional[Union[OnceSchedule, RecurringSchedule, Dict[str, Any]]] = None
    show_after: Optional[datetime] = None
    content: Optional[
        Union[HowToContent, ChecklistContent, ShoppingListContent, Dict[str, Any]]
    ] = None
    metrics: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class TaskCreate(TaskBase):
    source: TaskSource = TaskSource.MANUAL
    source_image_id: Optional[uuid.UUID] = None
    ai_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    ai_provider: Optional[str] = None


class TaskUpdate(BaseModel, EnhancedFieldsMixin):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[TaskPriority] = None
    completed: Optional[bool] = None
    status: Optional[TaskStatus] = None
    snoozed_until: Optional[datetime] = None
    task_types: Optional[List[TaskType]] = None

    # Enhanced fields
    schedule: Optional[Union[OnceSchedule, RecurringSchedule, Dict[str, Any]]] = None
    show_after: Optional[datetime] = None
    content: Optional[
        Union[HowToContent, ChecklistContent, ShoppingListContent, Dict[str, Any]]
    ] = None
    metrics: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class Task(TaskBase):
    id: int
    user_id: uuid.UUID
    source: TaskSource = TaskSource.MANUAL
    source_image_id: Optional[uuid.UUID] = None
    ai_confidence: Optional[float] = None
    ai_provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Image URLs - populated when fetching tasks
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    # Snooze options - populated when fetching tasks for responsive UI
    snooze_options: Optional[Dict[str, SnoozeOptionData]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("task_types", mode="before")
    @classmethod
    def parse_task_types(cls, v):
        """Parse task_types from database JSONB format to TaskType enum list."""
        if v is None:
            return []
        if isinstance(v, list):
            parsed = []
            for item in v:
                if isinstance(item, TaskType):
                    parsed.append(item)
                elif isinstance(item, str):
                    try:
                        parsed.append(TaskType(item))
                    except ValueError:
                        logger.warning(
                            f"Invalid task type encountered during deserialization: {item}"
                        )
            return parsed
        return []


class SnoozeRequest(BaseModel):
    snooze_until: Optional[datetime] = None
    snooze_option: Optional[str] = Field(
        None, description="Predefined snooze option key"
    )


class AITaskCreate(TaskCreate):
    """Special model for AI-generated task creation with required AI fields"""

    source: Literal[TaskSource.AI_GENERATED] = TaskSource.AI_GENERATED
    source_image_id: uuid.UUID = Field(..., description="UUID of the source image")
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
    task_types: List[TaskType] = Field(default_factory=list)


class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis endpoint"""

    image_id: Optional[uuid.UUID] = Field(None, description="UUID of stored image")
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
