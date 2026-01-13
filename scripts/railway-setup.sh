#!/bin/bash
# Navo Maritime Platform - Railway Setup
# Run this once to set up Railway projects for each service

set -e

echo "🚂 Setting up Railway projects..."
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Logging in to Railway..."
railway login

# Create services
SERVICES=("gateway" "core" "vessel" "realtime" "notification")

for service in "${SERVICES[@]}"; do
    echo ""
    echo "📦 Setting up $service service..."
    cd services/$service
    
    # Initialize Railway project
    railway init --name "navo-$service"
    
    # Link to project
    railway link
    
    cd ../..
done

echo ""
echo "✅ Railway projects created!"
echo ""
echo "Next steps:"
echo "  1. Go to https://railway.app/dashboard"
echo "  2. Add environment variables to each service:"
echo "     - DATABASE_URL (from Supabase)"
echo "     - REDIS_URL (from Upstash)"
echo "     - JWT_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "  3. Deploy with: ./scripts/deploy.sh"
