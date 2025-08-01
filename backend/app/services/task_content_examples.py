"""Example usage of the flexible task content and metrics system."""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

from ..models import (
    TaskCreate,
    TaskSource,
    TaskPriority,
    TaskType,
    ContentType,
    HowToContent,
    ChecklistContent,
    ChecklistItem,
    ShoppingListContent,
    ShoppingListItem,
    OnceSchedule,
    RecurringSchedule,
    RecurringPattern,
    ScheduleType,
)


def create_washing_machine_task() -> TaskCreate:
    """Example: Create a recurring maintenance task with how-to guide."""

    # Create how-to content
    content = HowToContent(
        type=ContentType.HOW_TO_GUIDE,
        markdown="""## How to Clean Your Washing Machine

### Why Clean Your Washing Machine?
Over time, soap residue, fabric softener, and lint can build up inside your washing machine, 
leading to bad odors and reduced efficiency.

### What You'll Need:
- White vinegar (2 cups)
- Baking soda (1/2 cup)
- Microfiber cloth
- Old toothbrush (for seals)

### Steps:

1. **Run an Empty Hot Cycle with Vinegar**
   - Set your washer to the hottest water setting and largest load size
   - Add 2 cups of white vinegar to the detergent dispenser
   - Run a complete wash cycle

2. **Clean the Rubber Seals**
   - Mix equal parts water and vinegar in a spray bottle
   - Spray the rubber door seal
   - Wipe with a microfiber cloth, paying attention to folds

3. **Run a Baking Soda Cycle**
   - Add 1/2 cup of baking soda directly to the drum
   - Run another hot water cycle

4. **Wipe Down the Exterior**
   - Use a damp microfiber cloth to clean the outside
   - Don't forget the control panel!

5. **Leave Door Open to Dry**
   - After cleaning, leave the door open for a few hours
   - This prevents mold and mildew growth
""",
        images=[
            {
                "url": "https://example.com/washing-machine-seal.jpg",
                "caption": "Pay special attention to the rubber seal",
            },
            {
                "url": "https://example.com/vinegar-dispenser.jpg",
                "caption": "Pour vinegar into the detergent dispenser",
            },
        ],
        videos=[
            {
                "url": "https://youtube.com/watch?v=example",
                "title": "Complete Washing Machine Cleaning Tutorial",
            }
        ],
        links=[
            {
                "url": "https://samsung.com/support/washing-machine-maintenance",
                "text": "Manufacturer's Maintenance Guide",
            }
        ],
    )

    # Create metrics
    metrics = {
        "complexity": "easy",
        "estimated_time_minutes": 45,
        "difficulty_score": 3,  # out of 10
        "requires_tools": ["vinegar", "baking soda", "microfiber cloth"],
        "cost_estimate": 5.00,
        "energy_level_required": "low",
    }

    # Create recurring schedule (every 3 months)
    schedule = RecurringSchedule(
        type=ScheduleType.RECURRING,
        pattern=RecurringPattern.INTERVAL,
        interval_days=90,
        next_occurrence=datetime.now(timezone.utc) + timedelta(days=90),
    )

    return TaskCreate(
        title="Clean Washing Machine",
        description="Quarterly maintenance to keep your washing machine fresh and efficient",
        priority=TaskPriority.MEDIUM,
        task_types=[TaskType.APPLIANCES, TaskType.MAINTENANCE],
        content=content,  # Will be converted to dict by validator
        metrics=metrics,
        schedule=schedule,  # Will be converted to dict by validator
        tags=["maintenance", "appliances", "cleaning", "quarterly"],
        source=TaskSource.MANUAL,
        ai_confidence=None,
    )


def create_bathroom_renovation_task() -> TaskCreate:
    """Example: Create a task with sub-tasks checklist."""

    # Create checklist content
    content = ChecklistContent(
        type=ContentType.CHECKLIST,
        items=[
            ChecklistItem(text="Research and hire contractor", completed=False),
            ChecklistItem(text="Choose tile and fixtures", completed=False),
            ChecklistItem(text="Get permits from city", completed=False),
            ChecklistItem(text="Order materials", completed=False),
            ChecklistItem(text="Prepare bathroom (remove items)", completed=False),
            ChecklistItem(text="Demo day preparation", completed=False),
            ChecklistItem(text="Final walkthrough with contractor", completed=False),
        ],
    )

    # Complex project metrics
    metrics = {
        "complexity": "high",
        "estimated_time_weeks": 4,
        "budget_range": "5000-15000",
        "contractor_required": True,
        "permits_required": True,
        "disruption_level": "high",
    }

    return TaskCreate(
        title="Bathroom Renovation",
        description="Complete renovation of the master bathroom",
        priority=TaskPriority.HIGH,
        task_types=[TaskType.INTERIOR, TaskType.PLUMBING, TaskType.ELECTRICITY],
        content=content,  # Will be converted to dict by validator
        metrics=metrics,
        tags=["renovation", "bathroom", "major-project"],
        source=TaskSource.MANUAL,
        ai_confidence=None,
    )


def create_shopping_list_task() -> TaskCreate:
    """Example: Create a shopping list task."""

    # Create shopping list content
    content = ShoppingListContent(
        type=ContentType.SHOPPING_LIST,
        items=[
            ShoppingListItem(
                name="Paint - Eggshell White", quantity="2 gallons", purchased=False
            ),
            ShoppingListItem(
                name="Paint brushes", quantity="3 (various sizes)", purchased=False
            ),
            ShoppingListItem(name="Painter's tape", quantity="2 rolls", purchased=True),
            ShoppingListItem(name="Drop cloths", quantity="2 large", purchased=False),
            ShoppingListItem(
                name="Paint roller and tray", quantity="1 set", purchased=False
            ),
            ShoppingListItem(
                name="Sandpaper", quantity="Mixed grits pack", purchased=False
            ),
        ],
        store="Home Depot",
        estimated_cost=125.50,
    )

    # Simple metrics for shopping
    metrics = {
        "urgency": "this_week",
        "driving_distance_miles": 5.2,
        "items_total": 6,
        "items_purchased": 1,
    }

    return TaskCreate(
        title="Buy painting supplies for living room",
        description="Get all supplies needed for weekend painting project",
        priority=TaskPriority.HIGH,
        task_types=[TaskType.INTERIOR],
        content=content,  # Will be converted to dict by validator
        metrics=metrics,
        tags=["shopping", "painting", "living-room"],
        source=TaskSource.MANUAL,
        ai_confidence=None,
    )


def create_future_task() -> TaskCreate:
    """Example: Create a task that won't be visible until a future date."""

    # Calculate next spring (approximately)
    now = datetime.now(timezone.utc)
    next_spring = (
        datetime(now.year + 1, 3, 20, tzinfo=timezone.utc)
        if now.month > 3
        else datetime(now.year, 3, 20, tzinfo=timezone.utc)
    )

    return TaskCreate(
        title="Spring Garden Preparation",
        description="Prepare garden beds for spring planting season",
        priority=TaskPriority.MEDIUM,
        task_types=[TaskType.EXTERIOR, TaskType.MAINTENANCE],
        show_after=next_spring - timedelta(days=14),  # Show 2 weeks before spring
        schedule=OnceSchedule(
            type=ScheduleType.ONCE, date=next_spring
        ),  # Will be converted to dict by validator
        metrics={
            "complexity": "medium",
            "estimated_time_hours": 8,
            "weather_dependent": True,
            "requires_tools": ["rake", "shovel", "pruning shears", "mulch"],
        },
        tags=["seasonal", "garden", "spring", "outdoor"],
        source=TaskSource.MANUAL,
        ai_confidence=None,
    )


def parse_task_content(content: Dict[str, Any]) -> str:
    """
    Helper function to parse task content for display.
    Returns a human-readable summary of the content.
    """
    if not content:
        return ""

    content_type = content.get("type")

    if content_type == ContentType.HOW_TO_GUIDE.value:
        return (
            f"How-to guide with {len(content.get('images', []))} images, "
            f"{len(content.get('videos', []))} videos"
        )

    elif content_type == ContentType.CHECKLIST.value:
        items = content.get("items", [])
        completed = sum(1 for item in items if item.get("completed", False))
        return f"Checklist: {completed}/{len(items)} completed"

    elif content_type == ContentType.SHOPPING_LIST.value:
        items = content.get("items", [])
        purchased = sum(1 for item in items if item.get("purchased", False))
        store = content.get("store", "Unknown")
        return f"Shopping list for {store}: {purchased}/{len(items)} purchased"

    return "Custom content"


def get_next_scheduled_date(schedule: Dict[str, Any]) -> Optional[datetime]:
    """
    Calculate the next scheduled date for a task based on its schedule configuration.
    """
    if not schedule:
        return None

    schedule_type = schedule.get("type")

    if schedule_type == ScheduleType.ONCE.value:
        date_str = schedule.get("date")
        if date_str:
            return datetime.fromisoformat(date_str)

    elif schedule_type == ScheduleType.RECURRING.value:
        occurrence_str = schedule.get("next_occurrence")
        if occurrence_str:
            return datetime.fromisoformat(occurrence_str)

    return None
