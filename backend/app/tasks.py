from fastapi import APIRouter, HTTPException, Header, Query
from typing import List, Optional
from datetime import datetime
from .models import Task, TaskCreate, TaskUpdate, TaskStatus, SnoozeRequest
from .database import supabase

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# For now, we'll use a header for user_id (we'll add proper auth later)
@router.get("/", response_model=List[Task])
async def get_tasks(
    user_id: str = Header(..., alias="x-user-id"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status")
):
    query = supabase.table('tasks').select('*').eq('user_id', user_id)
    
    if status:
        query = query.eq('status', status.value)
    
    response = query.execute()
    return response.data

@router.get("/active", response_model=List[Task])
async def get_active_tasks(user_id: str = Header(..., alias="x-user-id")):
    response = supabase.table('tasks').select('*').eq('user_id', user_id).eq('status', TaskStatus.ACTIVE.value).execute()
    return response.data

@router.get("/snoozed", response_model=List[Task])
async def get_snoozed_tasks(user_id: str = Header(..., alias="x-user-id")):
    response = supabase.table('tasks').select('*').eq('user_id', user_id).eq('status', TaskStatus.SNOOZED.value).execute()
    return response.data

@router.post("/", response_model=Task)
async def create_task(task: TaskCreate, user_id: str = Header(..., alias="x-user-id")):
    task_data = task.model_dump()
    task_data['user_id'] = user_id

    response = supabase.table('tasks').insert(task_data).execute()
    return response.data[0]

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: int, user_id: str = Header(..., alias="x-user-id")):
    response = supabase.table('tasks').select('*').eq('id', task_id).eq('user_id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]

@router.put("/{task_id}", response_model=Task)
async def update_task(task_id: int, task: TaskUpdate, user_id: str = Header(..., alias="x-user-id")):
    task_data = {k: v for k, v in task.model_dump().items() if v is not None}
    
    # Handle status transitions
    if 'completed' in task_data:
        if task_data['completed']:
            task_data['status'] = TaskStatus.COMPLETED.value
        else:
            task_data['status'] = TaskStatus.ACTIVE.value
            task_data['snoozed_until'] = None

    response = supabase.table('tasks').update(task_data).eq('id', task_id).eq('user_id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]

@router.delete("/{task_id}")
async def delete_task(task_id: int, user_id: str = Header(..., alias="x-user-id")):
    response = supabase.table('tasks').delete().eq('id', task_id).eq('user_id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

@router.post("/{task_id}/snooze", response_model=Task)
async def snooze_task(
    task_id: int, 
    snooze_request: SnoozeRequest, 
    user_id: str = Header(..., alias="x-user-id")
):
    # If no date provided, snooze indefinitely (year 9999)
    snooze_until = snooze_request.snooze_until or datetime.max
    
    update_data = {
        'status': TaskStatus.SNOOZED.value,
        'snoozed_until': snooze_until.isoformat()
    }
    
    response = supabase.table('tasks').update(update_data).eq('id', task_id).eq('user_id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]

@router.post("/{task_id}/unsnooze", response_model=Task)
async def unsnooze_task(task_id: int, user_id: str = Header(..., alias="x-user-id")):
    update_data = {
        'status': TaskStatus.ACTIVE.value,
        'snoozed_until': None
    }
    
    response = supabase.table('tasks').update(update_data).eq('id', task_id).eq('user_id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]