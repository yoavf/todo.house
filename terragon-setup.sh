#!/bin/bash
set -e

# terragon-setup.sh - Setup script for todo.house codebase development
# This script sets up the React Native Expo project with pnpm package manager

echo "🏠 Setting up todo.house codebase for development..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    echo "   or visit: https://pnpm.io/installation"
    exit 1
fi

echo "✅ pnpm is installed ($(pnpm --version))"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found. Please run this script from the project root directory."
    exit 1
fi

# Verify this is the todo.house project
if ! grep -q "todo.house" package.json; then
    echo "❌ This doesn't appear to be the todo.house project."
    exit 1
fi

echo "✅ Found todo.house project"

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Verify TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
npx tsc --noEmit

# Run linter
echo "🧹 Running linter..."
pnpm run lint

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm start          - Start development server"
echo "  pnpm run android    - Run on Android"
echo "  pnpm run ios        - Run on iOS"  
echo "  pnpm run web        - Run on web"
echo "  pnpm run lint       - Run linter"
echo ""
echo "📝 Note: You may need to set up environment variables for AI features:"
echo "   - OPENAI_API_KEY (for image analysis)"
echo ""
echo "🚀 Ready to start developing!"