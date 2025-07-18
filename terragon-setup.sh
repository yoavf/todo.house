#!/bin/bash
set -e

# terragon-setup.sh - Setup script for todo.house codebase development
# This script sets up the React Native Expo project with npm package manager

echo "🏠 Setting up todo.house codebase for development..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ npm is installed ($(npm --version))"

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
echo "📦 Installing dependencies with npm..."
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  npm start           - Start development server"
echo "  npm run android     - Run on Android"
echo "  npm run ios         - Run on iOS"
echo "  npm run web         - Run on web"
echo "  npm run lint        - Run linter"
echo ""
echo "📝 Note: You may need to set up environment variables for AI features:"
echo "   - OPENAI_API_KEY (for image analysis)"
echo ""
echo "🚀 Ready to start developing!"