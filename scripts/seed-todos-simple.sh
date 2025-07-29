#!/bin/bash

# Simple seed script that assumes user already exists
API_URL="${API_URL:-http://localhost:8000}"
USER_ID="${TEST_USER_ID:-550e8400-e29b-41d4-a716-446655440000}"

echo "📡 Creating todos for existing user: $USER_ID"

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
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ Created: $title"
    ((success_count++))
  else
    echo "⚠️  Skipped: $title (may already exist)"
  fi
done

echo "🎉 Created $success_count todos!"