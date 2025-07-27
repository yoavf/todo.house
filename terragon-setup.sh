#!/bin/bash
# terragon-setup.sh - Custom setup script for your Terragon environment
# This script runs when your sandbox environment starts

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add UV to PATH - UV installs to ~/.local/bin, not ~/.cargo
export PATH="$HOME/.local/bin:$PATH"

# Install pnpm globally
npm install -g pnpm

# Try to approve builds (though it seems there's nothing to approve)
pnpm approve-builds supabase || true

# Install dependencies
pnpm run install:all

echo "Setup complete!"