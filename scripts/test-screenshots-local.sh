#!/bin/bash
# Test screenshot workflow locally

set -e

echo "🧪 Testing screenshot workflow locally..."

# Check if Playwright is installed
if ! pnpm list playwright > /dev/null 2>&1; then
    echo "❌ Playwright not found. Installing..."
    pnpm add -D playwright
    pnpm exec playwright install chromium
fi

# Start backend
echo "🚀 Starting backend..."
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🚀 Starting frontend..."
cd frontend
pnpm run dev &
FRONTEND_PID=$!
cd ..

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit
}
trap cleanup EXIT INT TERM

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 5

# Check backend
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 2
done

# Check frontend
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    echo "Waiting for frontend... ($i/30)"
    sleep 2
done

# Seed test data
echo "🌱 Seeding test data..."
cd backend
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000 uv run python ../scripts/seed_test_data.py
cd ..

# Take screenshots
echo "📸 Taking screenshots..."
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000 node scripts/take-screenshots.js

echo "✅ Test complete! Check the screenshots/ directory."