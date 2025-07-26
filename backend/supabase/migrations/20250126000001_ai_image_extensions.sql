-- Migration: 003_ai_image_extensions.sql
-- Description: Add AI image processing capabilities with images and image_analyses tables, extend tasks table

-- Create images table for storing uploaded images and their analysis status
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create image_analyses table for logging AI provider interactions
CREATE TABLE IF NOT EXISTS image_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    prompt_used TEXT NOT NULL,
    raw_response JSONB NOT NULL,
    processing_time FLOAT NOT NULL,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend tasks table with AI-related columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_image_id UUID REFERENCES images(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_confidence FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_provider TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_analysis_status ON images(analysis_status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_analyses_image_id ON image_analyses(image_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_provider ON image_analyses(provider);
CREATE INDEX IF NOT EXISTS idx_image_analyses_created_at ON image_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_source_image_id ON tasks(source_image_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_confidence ON tasks(ai_confidence DESC);

-- Enable Row Level Security for new tables
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for images table
CREATE POLICY "Users can view their own images" ON images
    FOR SELECT
    USING (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can create their own images" ON images
    FOR INSERT
    WITH CHECK (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can update their own images" ON images
    FOR UPDATE
    USING (true)  -- In prod: auth.uid() = user_id
    WITH CHECK (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can delete their own images" ON images
    FOR DELETE
    USING (true);  -- In prod: auth.uid() = user_id

-- Create RLS policies for image_analyses table
CREATE POLICY "Users can view analyses of their images" ON image_analyses
    FOR SELECT
    USING (true);  -- In prod: EXISTS (SELECT 1 FROM images WHERE images.id = image_analyses.image_id AND images.user_id = auth.uid())

CREATE POLICY "Service can create image analyses" ON image_analyses
    FOR INSERT
    WITH CHECK (true);  -- In prod: would check for service role or proper image ownership

CREATE POLICY "Service can update image analyses" ON image_analyses
    FOR UPDATE
    USING (true)  -- In prod: would check for service role or proper image ownership
    WITH CHECK (true);

-- Add trigger for images updated_at (if we add this column later)
-- Note: images table doesn't have updated_at column in current design, but adding trigger function for consistency
CREATE OR REPLACE FUNCTION update_images_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update processed_at when analysis_status changes to completed or failed
    IF OLD.analysis_status != NEW.analysis_status AND NEW.analysis_status IN ('completed', 'failed') THEN
        NEW.processed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_processed_at_trigger 
    BEFORE UPDATE ON images
    FOR EACH ROW 
    EXECUTE FUNCTION update_images_processed_at();

-- Add comments for documentation
COMMENT ON TABLE images IS 'Stores uploaded images and their AI analysis status';
COMMENT ON TABLE image_analyses IS 'Logs AI provider interactions and responses for images';
COMMENT ON COLUMN tasks.source IS 'Indicates whether task was created manually or by AI';
COMMENT ON COLUMN tasks.source_image_id IS 'References the image that generated this task (if AI-generated)';
COMMENT ON COLUMN tasks.ai_confidence IS 'AI confidence score for generated tasks (0.0-1.0)';
COMMENT ON COLUMN tasks.ai_provider IS 'Name of AI provider that generated this task';