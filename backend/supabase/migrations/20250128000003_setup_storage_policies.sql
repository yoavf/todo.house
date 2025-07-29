-- Setup storage policies for task-images bucket

-- First ensure the bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-images', 
    'task-images', 
    true,  -- Public bucket
    10485760,  -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) 
DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Allow public access to task images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload task images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own task images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to task-images" ON storage.objects;

-- Create permissive policies for development
-- Allow anyone to view images in the task-images bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'task-images');

-- Allow anyone to upload images to the task-images bucket (for development)
CREATE POLICY "Public Upload" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'task-images');

-- Allow anyone to update images in the task-images bucket (for development)
CREATE POLICY "Public Update" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'task-images')
    WITH CHECK (bucket_id = 'task-images');

-- Allow anyone to delete images in the task-images bucket (for development)
CREATE POLICY "Public Delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'task-images');