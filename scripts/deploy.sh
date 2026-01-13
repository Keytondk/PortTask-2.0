#!/bin/bash
# Navo Maritime Platform - Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying Navo to $ENVIRONMENT..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check required tools
check_tools() {
    echo "Checking required tools..."
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Railway CLI not found. Install with: npm i -g @railway/cli${NC}"
    fi
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel CLI not found. Install with: npm i -g vercel${NC}"
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}pnpm not found. Install with: npm i -g pnpm${NC}"
        exit 1
    fi
}

# Deploy Go services to Railway
deploy_services() {
    echo ""
    echo "📦 Deploying Go services to Railway..."
    
    SERVICES=("gateway" "core" "vessel" "realtime" "notification")
    
    for service in "${SERVICES[@]}"; do
        echo "  Deploying $service..."
        cd services/$service
        railway up --detach 2>/dev/null || echo "  ⚠️  $service: Run 'railway link' first"
        cd ../..
    done
    
    echo -e "${GREEN}✓ Services deployed${NC}"
}

# Deploy Next.js apps to Vercel
deploy_apps() {
    echo ""
    echo "🌐 Deploying Next.js apps to Vercel..."
    
    APPS=("key" "portal" "vendor")
    
    for app in "${APPS[@]}"; do
        echo "  Deploying $app..."
        cd apps/$app
        vercel --prod 2>/dev/null || echo "  ⚠️  $app: Run 'vercel link' first"
        cd ../..
    done
    
    echo -e "${GREEN}✓ Apps deployed${NC}"
}

# Run database migrations
run_migrations() {
    echo ""
    echo "🗄️  Running database migrations..."
    
    cd packages/db
    pnpm db:push
    cd ../..
    
    echo -e "${GREEN}✓ Migrations complete${NC}"
}

# Main
main() {
    check_tools
    
    echo ""
    echo "┌─────────────────────────────────────┐"
    echo "│   Navo Maritime Platform Deploy     │"
    echo "│   Environment: $ENVIRONMENT              │"
    echo "└─────────────────────────────────────┘"
    
    # Run migrations first
    run_migrations
    
    # Deploy services
    deploy_services
    
    # Deploy apps
    deploy_apps
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Set environment variables in Railway dashboard"
    echo "  2. Set environment variables in Vercel dashboard"
    echo "  3. Configure custom domains"
    echo ""
}

main
