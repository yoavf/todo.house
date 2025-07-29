#!/bin/bash

# Seed todos using curl for GitHub Actions
API_URL="${API_URL:-http://localhost:8000}"
USER_ID="${TEST_USER_ID:-550e8400-e29b-41d4-a716-446655440000}"
USER_EMAIL="test-user@example.com"

echo "📡 Seeding data via API at $API_URL"

# First, create the user using direct database insert (since we have DB access in CI)
# Note: This assumes we have SUPABASE_URL and SUPABASE_KEY in environment
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  echo "🧑 Creating test user..."
  
  # Create user via Supabase REST API
  user_response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/rest/v1/users" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"id\":\"$USER_ID\",\"email\":\"$USER_EMAIL\"}")
  
  http_code=$(echo "$user_response" | tail -n1)
  
  if [ "$http_code" = "201" ] || [ "$http_code" = "409" ]; then
    echo "✅ User ready: $USER_EMAIL"
  else
    echo "⚠️  Could not create user (may already exist)"
  fi
else
  echo "⚠️  Skipping user creation (no Supabase credentials)"
fi

echo "📝 Creating todos..."

# Array of todos to create
todos=(
  '{"title":"Review pull request #42","description":"Review the new authentication feature implementation and provide feedback on security concerns","completed":false}'
  '{"title":"Update API documentation","description":"Add the new endpoints to the Swagger documentation and update examples","completed":false}'
  '{"title":"Fix database migration issue","description":"Investigate and fix the failing migration in the staging environment","completed":false}'
  '{"title":"Implement user analytics","description":"Add basic analytics tracking for user actions using Mixpanel","completed":false}'
  '{"title":"Deploy hotfix to production","description":"Deploy the authentication bug fix after QA approval","completed":true}'
  '{"title":"Write unit tests for new feature","description":"Add comprehensive test coverage for the payment processing module","completed":true}'
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