#!/bin/bash

# Detect current local IP
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)

echo "🌐 Local IP detected: $LOCAL_IP"
echo "📱 Frontend: http://$LOCAL_IP:3000"
echo "🔧 Backend: http://$LOCAL_IP:8000"

# Set environment variable for frontend
export NEXT_PUBLIC_API_URL="http://$LOCAL_IP:8000"

# Start both services
concurrently "pnpm run dev:backend" "pnpm run dev:frontend"