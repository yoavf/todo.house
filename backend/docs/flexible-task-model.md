# Flexible Task Model Design

## Overview

The TodoHouse task model has been enhanced to support flexible content types, metrics, and scheduling capabilities while maintaining backward compatibility. This design uses PostgreSQL's JSONB capabilities for maximum flexibility.

## Database Schema Changes

### New Fields Added to Tasks Table

1. **content** (JSONB) - Stores various content types
2. **metrics** (JSONB) - Stores flexible metrics  
3. **schedule** (JSONB) - Scheduling configuration
4. **show_after** (TIMESTAMPTZ) - When task becomes visible
5. **tags** (TEXT[]) - Additional flexible tagging

### Indexes

- `idx_tasks_show_after` - For filtering future tasks
- `idx_tasks_tags` - GIN index for tag searches

## Content Types

### How-To Guide
```json
{
    "type": "how_to_guide",
    "markdown": "## Step-by-step instructions...",
    "images": [{"url": "...", "caption": "..."}],
    "videos": [{"url": "...", "title": "..."}],
    "links": [{"url": "...", "text": "..."}]
}
```

### Checklist
```json
{
    "type": "checklist",
    "items": [
        {"id": "uuid", "text": "Task item", "completed": false}
    ]
}
```

### Shopping List
```json
{
    "type": "shopping_list",
    "items": [
        {"name": "Item", "quantity": "2", "purchased": false}
    ],
    "store": "Store Name",
    "estimated_cost": 99.99
}
```

## Metrics

Flexible key-value pairs that can store any metrics:

```json
{
    "complexity": "medium",
    "estimated_time_minutes": 45,
    "difficulty_score": 7,
    "requires_tools": ["hammer", "drill"],
    "cost_estimate": 150.00
}
```

## Scheduling

### One-Time Schedule
```json
{
    "type": "once",
    "date": "2025-08-15T10:00:00Z"
}
```

### Recurring Schedule
```json
{
    "type": "recurring",
    "pattern": "interval",
    "interval_days": 90,
    "next_occurrence": "2025-08-01T10:00:00Z"
}
```

## Python Models

The Pydantic models automatically convert between typed models and JSON:

```python
# Creating a task with content
task = TaskCreate(
    title="Clean Washing Machine",
    content=HowToContent(...),  # Automatically converted to dict
    schedule=RecurringSchedule(...),  # Automatically converted to dict
    metrics={"complexity": "easy", "time_minutes": 45}
)
```

## Query Examples

### Find tasks that should be visible now
```sql
SELECT * FROM tasks 
WHERE user_id = ? 
AND (show_after IS NULL OR show_after <= NOW())
AND status = 'active';
```

### Find tasks with specific content type
```sql
SELECT * FROM tasks 
WHERE content->>'type' = 'shopping_list'
AND user_id = ?;
```

### Find tasks by tag
```sql
SELECT * FROM tasks 
WHERE tags @> ARRAY['maintenance']
AND user_id = ?;
```

## Migration Strategy

1. All new fields are nullable - no data migration required
2. Existing tasks continue to work without content/metrics
3. Frontend can progressively adopt new features
4. JSONB allows schema evolution without migrations

## Future Extensibility

The JSONB approach allows adding new:
- Content types without schema changes
- Metric fields as needed
- Schedule patterns
- Custom fields per task type

This design balances flexibility with query performance, using indexes where needed while maintaining the ability to evolve the schema over time.