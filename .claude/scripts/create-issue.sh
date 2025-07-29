#!/bin/bash
# Script to create issue with automatic label creation and project field setting
# Usage: ./.claude/create-issue.sh "Title" "Body" "labels" "P0|P1|P2" "XS|S|M|L|XL"

TITLE="$1"
BODY="$2"
LABELS="$3"
PRIORITY="$4"
SIZE="$5"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get label color
get_label_color() {
  case "$1" in
    "frontend") echo "0E8A16" ;;
    "monitoring") echo "1D76DB" ;;
    "infrastructure") echo "C5DEF5" ;;
    "testing") echo "BFD4F2" ;;
    "performance") echo "FEF2C0" ;;
    "documentation") echo "0075ca" ;;
    *) echo "E99695" ;; # default color
  esac
}

# Function to ensure label exists
ensure_label() {
  local label="$1"

  # Check if label exists
  if gh label list --repo yoavf/todo.house | grep -q "^$label"; then
    echo -e "${GREEN}✓${NC} Label '$label' already exists"
  else
    # Get color for this label
    local color=$(get_label_color "$label")

    echo -e "${YELLOW}→${NC} Creating label '$label'..."
    if gh label create "$label" --repo yoavf/todo.house --color "$color"; then
      echo -e "${GREEN}✓${NC} Created label '$label'"
    else
      echo -e "${RED}✗${NC} Failed to create label '$label'"
    fi
  fi
}

echo "=== Ensuring labels exist ==="
# Parse comma-separated labels and ensure each exists
IFS=',' read -ra LABEL_ARRAY <<< "$LABELS"
for label in "${LABEL_ARRAY[@]}"; do
  # Trim whitespace
  label=$(echo "$label" | xargs)
  ensure_label "$label"
done

echo ""
echo "=== Creating issue ==="

# Create issue (capture both URL and issue number)
OUTPUT=$(gh issue create --repo yoavf/todo.house \
  --title "$TITLE" \
  --body "$BODY" \
  --label "$LABELS" \
  --project "todo.house" 2>&1)

# Extract URL from output
ISSUE_URL=$(echo "$OUTPUT" | grep "https://github.com" | head -1)

# Handle label errors gracefully (shouldn't happen now)
if echo "$OUTPUT" | grep -q "could not add label"; then
  echo -e "${YELLOW}Warning: Some labels were not applied${NC}"
fi

# Extract issue number from URL
ISSUE_NUMBER=$(echo $ISSUE_URL | grep -o '[0-9]*$')

if [ -z "$ISSUE_NUMBER" ]; then
  echo -e "${RED}✗ Failed to create issue${NC}"
  echo "Output: $OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓${NC} Created issue #$ISSUE_NUMBER"
echo "URL: $ISSUE_URL"

# Wait a moment for GitHub to index the issue
echo ""
echo "=== Setting project fields ==="
sleep 2

# Get project item ID - with better error handling
ITEM_ID=$(gh api graphql -F issueNumber="$ISSUE_NUMBER" -f query='
  query($issueNumber: Int!) {
    repository(owner: "yoavf", name: "todo.house") {
      issue(number: $issueNumber) {
        projectItems(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
' --jq '.data.repository.issue.projectItems.nodes[0].id' 2>/dev/null)

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
  echo -e "${RED}✗ Could not find project item ID${NC}"
  echo "Issue was created but project fields were not set"
  exit 1
fi

echo "Project item ID: $ITEM_ID"

# Map priority to ID
case "$PRIORITY" in
  "P0") PRIORITY_ID="79628723" ;;
  "P1") PRIORITY_ID="0a877460" ;;
  "P2") PRIORITY_ID="da944a9c" ;;
  *) echo -e "${RED}✗ Invalid priority: $PRIORITY${NC}"; exit 1 ;;
esac

# Map size to ID
case "$SIZE" in
  "XS") SIZE_ID="eff732af" ;;
  "S") SIZE_ID="9592a5a3" ;;
  "M") SIZE_ID="9728cbdc" ;;
  "L") SIZE_ID="c53df028" ;;
  "XL") SIZE_ID="7b141a16" ;;
  *) echo -e "${RED}✗ Invalid size: $SIZE${NC}"; exit 1 ;;
esac

# Set project fields
echo "→ Setting Priority to $PRIORITY..."
if gh project item-edit --project-id PVT_kwHOAAzkQs4A_FUN --id "$ITEM_ID" \
  --field-id PVTSSF_lAHOAAzkQs4A_FUNzgyStVk --single-select-option-id "$PRIORITY_ID" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Priority set to $PRIORITY"
else
  echo -e "${YELLOW}!${NC} Could not set priority"
fi

echo "→ Setting Status to Backlog..."
if gh project item-edit --project-id PVT_kwHOAAzkQs4A_FUN --id "$ITEM_ID" \
  --field-id PVTSSF_lAHOAAzkQs4A_FUNzgyStJQ --single-select-option-id "f75ad846" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Status set to Backlog"
else
  echo -e "${YELLOW}!${NC} Could not set status"
fi

echo "→ Setting Size to $SIZE..."
if gh project item-edit --project-id PVT_kwHOAAzkQs4A_FUN --id "$ITEM_ID" \
  --field-id PVTSSF_lAHOAAzkQs4A_FUNzgyStVo --single-select-option-id "$SIZE_ID" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Size set to $SIZE"
else
  echo -e "${YELLOW}!${NC} Could not set size"
fi

echo ""
echo -e "${GREEN}✓ Done!${NC} Issue created: $ISSUE_URL"