from typing import List, Dict, Any, Optional
from ..models import TaskPriority, AITaskCreate
from ..database import supabase


class TaskService:
    """Service for handling task creation and management logic"""
    
    @staticmethod
    def determine_priority_from_confidence(confidence: float) -> TaskPriority:
        """
        Determine task priority based on AI confidence score.
        
        Higher confidence scores indicate more certain/urgent issues:
        - >= 0.8: High priority (very confident about the issue)
        - >= 0.6: Medium priority (moderately confident)
        - < 0.6: Low priority (less certain, needs verification)
        """
        if confidence >= 0.8:
            return TaskPriority.HIGH
        elif confidence >= 0.6:
            return TaskPriority.MEDIUM
        else:
            return TaskPriority.LOW
    
    @staticmethod
    async def create_ai_tasks(
        tasks: List[AITaskCreate], 
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Create multiple AI-generated tasks with automatic prioritization.
        
        Args:
            tasks: List of AI task creation models
            user_id: User ID to assign tasks to
            
        Returns:
            List of created task records
        """
        created_tasks = []
        
        for task in tasks:
            task_data = task.model_dump()
            task_data['user_id'] = user_id
            
            # Convert enum to string value for database
            task_data['source'] = task_data['source'].value
            
            # Override priority based on AI confidence if not already set
            if task.priority == TaskPriority.MEDIUM:  # Default value
                task_data['priority'] = TaskService.determine_priority_from_confidence(
                    task.ai_confidence
                ).value
            else:
                task_data['priority'] = task_data['priority'].value
            
            response = supabase.table('tasks').insert(task_data).execute()
            if response.data:
                created_tasks.append(response.data[0])
        
        return created_tasks
    
    @staticmethod
    async def create_single_ai_task(
        task: AITaskCreate,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create a single AI-generated task with automatic prioritization.
        
        Args:
            task: AI task creation model
            user_id: User ID to assign task to
            
        Returns:
            Created task record
        """
        results = await TaskService.create_ai_tasks([task], user_id)
        return results[0] if results else None