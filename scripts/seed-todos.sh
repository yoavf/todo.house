#!/bin/bash

# Seed todos using curl for GitHub Actions
API_URL="${API_URL:-http://localhost:8000}"
USER_ID="${TEST_USER_ID:-550e8400-e29b-41d4-a716-446655440000}"
USER_EMAIL="test-user@example.com"

echo "📡 Seeding data via API at $API_URL"

# First, clean up any existing test data to avoid conflicts
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  echo "🧹 Cleaning up existing test data..."
  
  # Delete existing tasks for this user
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/tasks?user_id=eq.$USER_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" > /dev/null
  
  # Delete existing test user
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/users?id=eq.$USER_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" > /dev/null
  
  echo "🧑 Creating test user..."
  
  # Create user via Supabase REST API with upsert
  user_response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/rest/v1/users" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation,resolution=merge-duplicates" \
    -d "{\"id\":\"$USER_ID\",\"email\":\"$USER_EMAIL\"}")
  
  http_code=$(echo "$user_response" | tail -n1)
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ User ready: $USER_EMAIL"
  else
    echo "❌ Failed to create user (HTTP $http_code)"
    echo "Response: $(echo "$user_response" | sed '$d')"
  fi
else
  echo "⚠️  Skipping user creation (no Supabase credentials)"
fi

echo "📝 Creating todos..."

# Array of todos to create
todos=(
  '{"title":"Review pull request #42","description":"Review the new authentication feature implementation and provide feedback on security concerns","completed":false,"priority":"high"}'
  '{"title":"Update API documentation","description":"Add the new endpoints to the Swagger documentation and update examples","completed":false,"priority":"medium"}'
  '{"title":"Fix database migration issue","description":"Investigate and fix the failing migration in the staging environment","completed":false,"priority":"high"}'
  '{"title":"Implement user analytics","description":"Add basic analytics tracking for user actions using Mixpanel","completed":false,"priority":"low"}'
  '{"title":"Deploy hotfix to production","description":"Deploy the authentication bug fix after QA approval","completed":true,"priority":"high"}'
  '{"title":"Write unit tests for new feature","description":"Add comprehensive test coverage for the payment processing module","completed":true,"priority":"medium"}'
)

# Create each todo
for todo in "${todos[@]}"; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/tasks/" \
    -H "Content-Type: application/json" \
    -H "X-User-ID: $USER_ID" \
    -d "$todo")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    title=$(echo "$todo" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created: $title"
  else
    title=$(echo "$todo" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    echo "❌ Failed to create: $title (HTTP $http_code)"
  fi
done

echo "🎉 Seeding complete!"