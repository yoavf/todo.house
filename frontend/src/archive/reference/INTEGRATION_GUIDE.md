# TodoHouse Frontend Integration Guide

This guide shows how to integrate the existing API and business logic into your new UI.

## Core Imports

```typescript
// API client and types
import { tasksAPI, type Task, type TaskCreate, type TaskUpdate } from '@/lib/api';

// React hook for task management
import { useTasks } from '@/hooks/useTasks';

// Utility functions
import { cn, getTaskTypeColor } from '@/lib/utils';
```

## 1. Task Management Hook

The `useTasks` hook provides all task operations with built-in state management:

```typescript
const {
  tasks,        // Task[] - all tasks
  loading,      // boolean - loading state
  error,        // string | null - error message
  refetch,      // () => void - refresh tasks
  createTask,   // (task: TaskCreate) => Promise<Task>
  updateTask,   // (id: number, update: TaskUpdate) => Promise<Task>
  deleteTask    // (id: number) => Promise<void>
} = useTasks();
```

### Example Usage:

```typescript
// In your component
export function TasksPage() {
  const { tasks, loading, error, createTask, updateTask } = useTasks();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleCreateTask = async () => {
    await createTask({
      title: "New Task",
      description: "Task description",
      priority: "medium",
      task_types: ["maintenance"]
    });
  };

  const handleCompleteTask = async (taskId: number) => {
    await updateTask(taskId, { 
      completed: true, 
      status: "completed" 
    });
  };

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <button onClick={() => handleCompleteTask(task.id)}>
            Complete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 2. Direct API Calls

If you need more control, use the API client directly:

```typescript
// Get all tasks
const tasks = await tasksAPI.getTasks();

// Create a task
const newTask = await tasksAPI.createTask({
  title: "Fix leaky faucet",
  description: "Kitchen sink is dripping",
  priority: "high",
  task_types: ["plumbing", "repair"]
});

// Update a task
const updated = await tasksAPI.updateTask(taskId, {
  completed: true,
  status: "completed"
});

// Delete a task
await tasksAPI.deleteTask(taskId);
```

## 3. Image Analysis & AI Task Generation

```typescript
// Analyze an image and generate tasks
const handleImageUpload = async (file: File) => {
  try {
    const response = await tasksAPI.analyzeImage(file);
    
    // response contains:
    // - image_id: string
    // - tasks: GeneratedTask[]
    // - analysis_summary: string
    // - provider_used: string
    
    // Create tasks from AI suggestions
    for (const generatedTask of response.tasks) {
      await tasksAPI.createTask({
        title: generatedTask.title,
        description: generatedTask.description,
        priority: generatedTask.priority,
        source: "ai_generated",
        source_image_id: response.image_id,
        ai_confidence: generatedTask.confidence_score,
        task_types: generatedTask.task_types
      });
    }
  } catch (error) {
    console.error("Image analysis failed:", error);
  }
};
```

## 4. Task Types & Styling

Available task types and their colors:

```typescript
type TaskType = 
  | "interior"     // Blue
  | "exterior"     // Green  
  | "electricity"  // Yellow
  | "plumbing"     // Cyan
  | "appliances"   // Purple
  | "maintenance"  // Orange
  | "repair"       // Red

// Get color classes for a task type
import { getTaskTypeColor } from '@/lib/utils';

const colorClass = getTaskTypeColor("plumbing");
// Returns: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
```

## 5. Priority Levels

```typescript
type Priority = "low" | "medium" | "high";

// Suggested color scheme:
// high: red (bg-red-100 text-red-700)
// medium: yellow (bg-yellow-100 text-yellow-700)
// low: green (bg-green-100 text-green-700)
```

## 6. Task Status

```typescript
type Status = "active" | "snoozed" | "completed";

// Tasks can be snoozed until a specific date:
await updateTask(taskId, {
  status: "snoozed",
  snoozed_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

## 7. Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000
```

## 8. Common Patterns

### Loading States
```typescript
const { loading } = useTasks();

if (loading) {
  return <YourLoadingComponent />;
}
```

### Error Handling
```typescript
const { error, refetch } = useTasks();

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
}
```

### Filtering Tasks
```typescript
const { tasks } = useTasks();

// Active tasks only
const activeTasks = tasks.filter(t => !t.completed);

// AI-generated tasks
const aiTasks = tasks.filter(t => t.source === "ai_generated");

// High priority tasks
const urgentTasks = tasks.filter(t => t.priority === "high");

// Tasks by type
const plumbingTasks = tasks.filter(t => 
  t.task_types?.includes("plumbing")
);
```

## 9. Key Features to Implement

1. **Task List View**: Display all tasks with filters
2. **Task Creation**: Manual form + AI image analysis
3. **Task Details**: View/edit task with all properties
4. **Task Actions**: Complete, delete, snooze
5. **Image Upload**: Drag & drop or file picker
6. **AI Task Preview**: Review and select generated tasks
7. **Priority Badges**: Visual indicators
8. **Task Type Tags**: Colored category tags

## 10. Example Component Structure

```
app/
├── page.tsx           // Dashboard with task summary
├── tasks/
│   └── page.tsx      // Full task list view
└── layout.tsx        // Main layout with navigation

components/
├── TaskCard.tsx      // Individual task display
├── TaskForm.tsx      // Create/edit task form
├── TaskFilters.tsx   // Filter controls
├── ImageUploader.tsx // Image upload with AI
└── ui/              // Keep existing shadcn components
```