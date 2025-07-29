-- Migration: Add missing priority column
-- Description: Add priority column that was missing from the initial schema

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Add comment for documentation
COMMENT ON COLUMN tasks.priority IS 'Task priority level: low, medium, or high';