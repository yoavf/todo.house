-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', true)
ON CONFLICT (id) DO NOTHING;