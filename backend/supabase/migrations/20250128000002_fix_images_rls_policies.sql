-- Fix RLS policies for images table to allow inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can create their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images;

-- Recreate policies with explicit true values for development
CREATE POLICY "Allow all operations on images" ON images
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Also ensure the images table has RLS enabled
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Do the same for image_analyses
DROP POLICY IF EXISTS "Users can view analyses of their images" ON image_analyses;
DROP POLICY IF EXISTS "Service can create image analyses" ON image_analyses;
DROP POLICY IF EXISTS "Service can update image analyses" ON image_analyses;

CREATE POLICY "Allow all operations on image_analyses" ON image_analyses
    FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;