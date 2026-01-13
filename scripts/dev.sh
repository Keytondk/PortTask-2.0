#!/bin/bash
# Navo Maritime Platform - One-Command Development Setup
# Usage: ./scripts/dev.sh [--full|--simple|--frontend-only]

set -e

MODE=${1:-"--simple"}
COMPOSE_FILE="docker-compose.dev.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_banner() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}    🚢 Navo Maritime Platform - Development Mode${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker not found. Please install Docker Desktop.${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}Docker daemon not running. Please start Docker Desktop.${NC}"
        exit 1
    fi
}

check_deps() {
    if ! command -v pnpm &> /dev/null; then
        echo "Installing pnpm..."
        npm install -g pnpm
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        pnpm install
    fi
}

setup_env() {
    if [ ! -f ".env" ]; then
        echo "Creating .env from template..."
        cp .env.example .env
        
        # Generate random JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-secret-change-in-production-min32chars")
        sed -i.bak "s/your-super-secret-key-min-32-chars/$JWT_SECRET/" .env 2>/dev/null || true
        rm -f .env.bak
    fi
}

start_infrastructure() {
    echo -e "${GREEN}Starting infrastructure (Postgres + Redis)...${NC}"
    docker-compose -f $COMPOSE_FILE up -d postgres redis
    
    echo "Waiting for services to be ready..."
    sleep 3
    
    # Wait for Postgres
    until docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        echo "  Waiting for Postgres..."
        sleep 1
    done
    echo -e "${GREEN}✓ Postgres ready${NC}"
    
    # Wait for Redis  
    until docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; do
        echo "  Waiting for Redis..."
        sleep 1
    done
    echo -e "${GREEN}✓ Redis ready${NC}"
}

setup_database() {
    echo "Setting up database..."
    pnpm db:generate
    pnpm db:push
    
    echo "Seeding demo data..."
    pnpm db:seed 2>/dev/null || echo "  (seed already exists or failed - continuing)"
    
    echo -e "${GREEN}✓ Database ready${NC}"
}

start_backend() {
    echo -e "${GREEN}Starting Go backend...${NC}"
    
    if [ "$MODE" = "--full" ]; then
        # Full microservices mode
        docker-compose up -d gateway core vessel realtime notification
    else
        # Simplified monolith mode
        docker-compose -f $COMPOSE_FILE up -d navo-backend
    fi
}

start_frontend() {
    echo -e "${GREEN}Starting frontend apps...${NC}"
    echo ""
    echo "  Key App:    http://localhost:3000"
    echo "  Portal:     http://localhost:3001"  
    echo "  Vendor:     http://localhost:3002"
    echo ""
    
    pnpm dev
}

print_status() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}    ✓ Development environment ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  Demo login:  demo@navo.io / demo123456"
    echo ""
    echo "  Services:"
    echo "    API:       http://localhost:8080"
    echo "    Key App:   http://localhost:3000"
    echo "    Portal:    http://localhost:3001"
    echo "    Vendor:    http://localhost:3002"
    echo "    Prisma:    pnpm db:studio"
    echo ""
    echo "  Stop with:   docker-compose -f $COMPOSE_FILE down"
    echo ""
}

# Main
main() {
    print_banner
    
    case $MODE in
        --frontend-only)
            echo "Frontend-only mode (requires external backend)"
            check_deps
            start_frontend
            ;;
        --full)
            echo "Full microservices mode"
            COMPOSE_FILE="docker-compose.yml"
            check_docker
            check_deps
            setup_env
            start_infrastructure
            setup_database
            start_backend
            print_status
            start_frontend
            ;;
        --simple|*)
            echo "Simplified development mode"
            check_docker
            check_deps
            setup_env
            start_infrastructure
            setup_database
            print_status
            start_frontend
            ;;
    esac
}

main
