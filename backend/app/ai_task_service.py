"""
Service for handling AI-generated tasks including creation and prioritization logic.
"""
from typing import List, Dict
from .models import GeneratedTask, AITaskCreate, Task, TaskPriority, TaskSource
from .database import supabase


class AITaskService:
    """Service for managing AI-generated tasks"""
    
    def __init__(self):
        self.confidence_thresholds = {
            TaskPriority.HIGH: 0.8,
            TaskPriority.MEDIUM: 0.5,
            TaskPriority.LOW: 0.0
        }
    
    def prioritize_tasks(self, tasks: List[GeneratedTask]) -> List[GeneratedTask]:
        """
        Apply business logic for task prioritization based on AI confidence scores.
        
        Args:
            tasks: List of generated tasks with confidence scores
            
        Returns:
            List of tasks sorted by priority and confidence
        """
        # First, adjust priority based on confidence scores
        for task in tasks:
            task.priority = self._adjust_priority_by_confidence(task.priority, task.confidence_score)
        
        # Sort by priority (high first) and then by confidence (high first)
        priority_order = {TaskPriority.HIGH: 3, TaskPriority.MEDIUM: 2, TaskPriority.LOW: 1}
        
        return sorted(
            tasks,
            key=lambda t: (priority_order[t.priority], t.confidence_score),
            reverse=True
        )
    
    def _adjust_priority_by_confidence(self, original_priority: TaskPriority, confidence: float) -> TaskPriority:
        """
        Adjust task priority based on AI confidence score.
        
        Args:
            original_priority: Original priority from AI
            confidence: AI confidence score (0.0-1.0)
            
        Returns:
            Adjusted priority level
        """
        # If confidence is very low, downgrade priority
        if confidence < 0.3:
            if original_priority == TaskPriority.HIGH:
                return TaskPriority.MEDIUM
            elif original_priority == TaskPriority.MEDIUM:
                return TaskPriority.LOW
        
        # If confidence is very high, potentially upgrade priority for safety/urgent items
        elif confidence >= 0.9 and original_priority == TaskPriority.MEDIUM:
            return TaskPriority.HIGH
        
        return original_priority
    
    async def create_tasks_from_ai_response(
        self, 
        generated_tasks: List[GeneratedTask], 
        user_id: str, 
        image_id: str,
        ai_provider: str
    ) -> List[Task]:
        """
        Convert AI-generated tasks to Task objects and persist them.
        
        Args:
            generated_tasks: List of tasks from AI analysis
            user_id: User ID for task ownership
            image_id: Source image ID
            ai_provider: Name of AI provider used
            
        Returns:
            List of created Task objects
        """
        # Prioritize tasks first
        prioritized_tasks = self.prioritize_tasks(generated_tasks)
        
        created_tasks = []
        
        for generated_task in prioritized_tasks:
            # Create AITaskCreate model
            task_create = AITaskCreate(
                title=generated_task.title,
                description=generated_task.description,
                priority=generated_task.priority,
                source=TaskSource.AI_GENERATED,
                source_image_id=image_id,
                ai_confidence=generated_task.confidence_score,
                ai_provider=ai_provider
            )
            
            # Convert to dict for database insertion
            task_data = task_create.model_dump()
            task_data['user_id'] = user_id
            
            # Insert into database
            response = supabase.table('tasks').insert(task_data).execute()
            
            if response.data:
                created_tasks.append(Task(**response.data[0]))
        
        return created_tasks
    
    def filter_high_confidence_tasks(self, tasks: List[GeneratedTask], min_confidence: float = 0.7) -> List[GeneratedTask]:
        """
        Filter tasks to only include those above a minimum confidence threshold.
        
        Args:
            tasks: List of generated tasks
            min_confidence: Minimum confidence score to include
            
        Returns:
            Filtered list of high-confidence tasks
        """
        return [task for task in tasks if task.confidence_score >= min_confidence]
    
    def categorize_tasks_by_confidence(self, tasks: List[GeneratedTask]) -> Dict[str, List[GeneratedTask]]:
        """
        Categorize tasks by confidence levels for different handling.
        
        Args:
            tasks: List of generated tasks
            
        Returns:
            Dictionary with confidence categories as keys
        """
        categories = {
            'high_confidence': [],  # >= 0.8
            'medium_confidence': [],  # 0.5 - 0.79
            'low_confidence': []  # < 0.5
        }
        
        for task in tasks:
            if task.confidence_score >= 0.8:
                categories['high_confidence'].append(task)
            elif task.confidence_score >= 0.5:
                categories['medium_confidence'].append(task)
            else:
                categories['low_confidence'].append(task)
        
        return categories
    
    async def get_ai_generated_tasks(self, user_id: str, image_id: str = None) -> List[Task]:
        """
        Retrieve AI-generated tasks for a user, optionally filtered by image.
        
        Args:
            user_id: User ID
            image_id: Optional image ID to filter by
            
        Returns:
            List of AI-generated tasks
        """
        query = supabase.table('tasks').select('*').eq('user_id', user_id).eq('source', TaskSource.AI_GENERATED.value)
        
        if image_id:
            query = query.eq('source_image_id', image_id)
        
        response = query.execute()
        return [Task(**task_data) for task_data in response.data]
    
    async def get_tasks_by_confidence_range(
        self, 
        user_id: str, 
        min_confidence: float = 0.0, 
        max_confidence: float = 1.0
    ) -> List[Task]:
        """
        Get AI-generated tasks within a specific confidence range.
        
        Args:
            user_id: User ID
            min_confidence: Minimum confidence score
            max_confidence: Maximum confidence score
            
        Returns:
            List of tasks within confidence range
        """
        query = (supabase.table('tasks')
                .select('*')
                .eq('user_id', user_id)
                .eq('source', TaskSource.AI_GENERATED.value)
                .gte('ai_confidence', min_confidence)
                .lte('ai_confidence', max_confidence))
        
        response = query.execute()
        return [Task(**task_data) for task_data in response.data]