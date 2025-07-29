-- Migration: 20250729220535_add_task_types.sql
-- Description: Add task_types column to tasks table for categorizing tasks

-- Add task_types column to tasks table
-- Using JSONB array to store multiple task types per task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_types JSONB DEFAULT '[]'::jsonb;

-- Add check constraint to ensure task_types is an array
ALTER TABLE tasks ADD CONSTRAINT task_types_is_array 
  CHECK (jsonb_typeof(task_types) = 'array');

-- Create index for better performance when filtering by task types
CREATE INDEX IF NOT EXISTS idx_tasks_task_types ON tasks USING GIN (task_types);

-- Add comment for documentation
COMMENT ON COLUMN tasks.task_types IS 'Array of task type labels (interior, exterior, electricity, plumbing, appliances, maintenance, repair)';