-- Seed data for development
INSERT INTO users (id, email) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com') ON CONFLICT (email) DO NOTHING;