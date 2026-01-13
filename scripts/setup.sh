#!/bin/bash
# Navo Maritime Platform - First-Time Setup
# Usage: ./scripts/setup.sh

set -e

echo "🚢 Navo Maritime Platform - Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your credentials${NC}"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd packages/db
pnpm prisma generate
cd ../..

# Check for Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker detected. Start local services?"
    echo "   Run: docker-compose up -d"
else
    echo -e "${YELLOW}Docker not found. Install Docker for local development.${NC}"
fi

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Supabase/Redis credentials"
echo "  2. Run: docker-compose up -d (for local Postgres/Redis)"
echo "  3. Run: pnpm db:push (to sync database schema)"
echo "  4. Run: pnpm dev (to start all apps)"
echo ""
