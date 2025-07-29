#!/bin/bash

# Script that creates user first, then seeds tasks
API_URL="${API_URL:-http://localhost:8000}"
USER_ID="${TEST_USER_ID:-550e8400-e29b-41d4-a716-446655440000}"
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_KEY}"

echo "📡 Setting up test data for user: $USER_ID"

# First, check if we have Supabase credentials
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables"
  echo "These should be set by the GitHub workflow"
  exit 1
fi

# Create the user directly in Supabase using REST API
echo "👤 Creating user in Supabase..."
user_response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/rest/v1/users" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"id\":\"$USER_ID\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"}")

user_code=$(echo "$user_response" | tail -n1)
user_body=$(echo "$user_response" | sed '$d')

if [ "$user_code" = "201" ] || [ "$user_code" = "200" ]; then
  echo "✅ User created successfully"
elif [ "$user_code" = "409" ]; then
  echo "ℹ️  User already exists (409 Conflict) - continuing..."
else
  echo "⚠️  Failed to create user (HTTP $user_code)"
  echo "Response: $user_body"
  echo "Continuing anyway..."
fi

# Wait a moment for the user to be available
sleep 1

# Now verify the API can see the user by checking tasks
echo "🔍 Verifying user through API..."
verify_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/tasks/" \
  -H "x-user-id: $USER_ID")

verify_code=$(echo "$verify_response" | tail -n1)
verify_body=$(echo "$verify_response" | sed '$d')

if [ "$verify_code" = "200" ]; then
  echo "✅ User verified - API can access tasks"
  echo "Current tasks: $verify_body"
else
  echo "⚠️  API verification returned HTTP $verify_code"
  echo "Response: $verify_body"
fi

# Array of todos to create
todos=(
  '{"title":"Review pull request #42","description":"Review the new authentication feature implementation","completed":false}'
  '{"title":"Update API documentation","description":"Add the new endpoints to the Swagger documentation","completed":false}'
  '{"title":"Fix database migration","description":"Investigate and fix the failing migration issue","completed":false}'
  '{"title":"Deploy hotfix to production","description":"Deploy the authentication bug fix after QA approval","completed":true}'
)

# Create each todo
echo "📝 Creating todos..."
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
    echo "Error details: $body"
  fi
done

echo "🎉 Created $success_count todos!"

# Final verification
echo "📊 Final verification..."
final_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/tasks/" \
  -H "x-user-id: $USER_ID")

final_code=$(echo "$final_response" | tail -n1)
final_body=$(echo "$final_response" | sed '$d')

if [ "$final_code" = "200" ]; then
  task_count=$(echo "$final_body" | grep -o '"id"' | wc -l)
  echo "✅ Success! Found $task_count tasks for user"
else
  echo "❌ Final verification failed (HTTP $final_code)"
fi