-- Migration: 002_row_level_security.sql
-- Description: Set up Row Level Security policies

-- WARNING: These are DEVELOPMENT ONLY policies with permissive rules!
-- For production, replace all instances of 'true' with proper auth checks:
--   - USING (auth.uid() = user_id) for tasks
--   - USING (auth.uid() = id) for users
--   - USING (auth.role() = 'service_role') for service operations

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT
    USING (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can create their own tasks" ON tasks
    FOR INSERT
    WITH CHECK (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (true)  -- In prod: auth.uid() = user_id
    WITH CHECK (true);  -- In prod: auth.uid() = user_id

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (true);  -- In prod: auth.uid() = user_id

-- Users policies
CREATE POLICY "Users can view themselves" ON users
    FOR SELECT
    USING (true);  -- In prod: auth.uid() = id

CREATE POLICY "Service role can manage users" ON users
    FOR ALL
    USING (true);  -- In prod: would check for service role