#!/bin/bash
# terragon-setup.sh - Custom setup script for your Terragon environment
# This script runs when your sandbox environment starts

# Exit on error
set -e

echo "Starting Terragon setup for TodoHouse project..."

# Install uv (Python package manager)
echo "Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add UV to PATH - UV installs to ~/.local/bin, not ~/.cargo
export PATH="$HOME/.local/bin:$PATH"

# Install Node.js if not present (required for pnpm)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm globally
echo "Installing pnpm..."
npm install -g pnpm

# Install git if not present (required for husky)
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt-get update && sudo apt-get install -y git
fi

# Install project dependencies
echo "Installing all project dependencies..."
pnpm run install:all

# Setup husky hooks (for pre-commit checks)
echo "Setting up git hooks..."
cd /workspace && pnpm run prepare

# Create necessary environment files if they don't exist
echo "Setting up environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
# Database Configuration (SQLAlchemy)
DATABASE_URL=sqlite+aiosqlite:///./test.db

# Supabase Configuration (for storage)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key

# AI Provider Configuration (optional)
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.5-flash
DEFAULT_AI_PROVIDER=gemini

# Logging
LOG_LEVEL=INFO
ENABLE_JSON_LOGGING=true
EOF
    echo "Created backend/.env with default values"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000
EOF
    echo "Created frontend/.env.local with default values"
fi

# Display available commands
echo ""
echo "========================================="
echo "✅ Setup complete! Available commands:"
echo "========================================="
echo ""
echo "🚀 Development:"
echo "  npm run dev                    # Run both frontend and backend"
echo "  npm run dev:frontend           # Run frontend only"
echo "  npm run dev:backend            # Run backend only"
echo ""
echo "🧪 Testing:"
echo "  npm run test:backend           # Run all backend tests"
echo "  npm run test:backend:unit      # Run backend unit tests only"
echo "  npm run test:backend:integration # Run backend integration tests"
echo "  npm run test:frontend          # Run frontend tests"
echo ""
echo "🔍 Code Quality:"
echo "  npm run lint:backend           # Lint backend code (ruff)"
echo "  npm run lint:backend:fix       # Auto-fix backend linting issues"
echo "  npm run typecheck:backend      # Type check backend (mypy)"
echo "  cd frontend && pnpm lint       # Lint frontend code (biome)"
echo "  cd frontend && pnpm lint:fix   # Auto-fix frontend linting issues"
echo ""
echo "📦 Database:"
echo "  cd backend && uv run alembic upgrade head  # Run migrations"
echo "  cd backend && uv run alembic revision --autogenerate -m 'description'  # Create migration"
echo ""
echo "⚠️  Note: Pre-commit hooks are active!"
echo "  - Python files: ruff, mypy, and unit tests will run automatically"
echo "  - TypeScript/React files: biome, tsc, and tests will run automatically"
echo ""
echo "========================================="