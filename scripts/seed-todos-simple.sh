#!/bin/bash

# Simple seed script that assumes user already exists
API_URL="${API_URL:-http://localhost:8000}"
USER_ID="${TEST_USER_ID:-550e8400-e29b-41d4-a716-446655440000}"

echo "📡 Creating todos for existing user: $USER_ID"

# First, let's verify the user exists by trying to fetch their tasks
echo "🔍 Verifying user can access tasks..."
verify_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/tasks/" \
  -H "x-user-id: $USER_ID")

verify_code=$(echo "$verify_response" | tail -n1)
verify_body=$(echo "$verify_response" | sed '$d')

if [ "$verify_code" = "200" ]; then
  echo "✅ User verified - can access tasks endpoint"
  echo "Current tasks: $verify_body"
else
  echo "❌ Failed to verify user (HTTP $verify_code)"
  echo "Response: $verify_body"
  echo "Continuing anyway..."
fi

# Array of todos to create
todos=(
  '{"title":"Review pull request #42","description":"Review the new authentication feature implementation","completed":false}'
  '{"title":"Update API documentation","description":"Add the new endpoints to the Swagger documentation","completed":false}'
  '{"title":"Fix database migration","description":"Investigate and fix the failing migration issue","completed":false}'
  '{"title":"Deploy hotfix to production","description":"Deploy the authentication bug fix after QA approval","completed":true}'
)

# Create each todo
success_count=0
for todo in "${todos[@]}"; do
  title=$(echo "$todo" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/tasks/" \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d "$todo")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ Created: $title"
    ((success_count++))
  else
    echo "❌ Failed: $title (HTTP $http_code)"
    if [ "$http_code" = "500" ]; then
      # Try to get the actual error from the logs
      echo "Error details: $body"
    fi
  fi
done

echo "🎉 Created $success_count todos!"