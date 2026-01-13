#!/bin/bash
# Navo Maritime Platform - Pre-Deployment Validation
# Usage: ./scripts/preflight.sh [environment]
#
# This script validates that everything is ready for deployment.
# Run this BEFORE deploying to catch issues early.

set -e

ENVIRONMENT=${1:-production}
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
log_error() { echo -e "${RED}[✗]${NC} $1"; ERRORS=$((ERRORS + 1)); }

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================
# ENVIRONMENT CHECKS
# ============================================
check_environment() {
    header "Environment Checks"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_success "Node.js: $NODE_VERSION"
    else
        log_error "Node.js not found"
    fi

    # Check pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        log_success "pnpm: $PNPM_VERSION"
    else
        log_error "pnpm not found (install: npm i -g pnpm)"
    fi

    # Check Go
    if command -v go &> /dev/null; then
        GO_VERSION=$(go version | awk '{print $3}')
        log_success "Go: $GO_VERSION"
    else
        log_error "Go not found (required for backend services)"
    fi

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker -v | awk '{print $3}' | tr -d ',')
        log_success "Docker: $DOCKER_VERSION"
    else
        log_warning "Docker not found (required for containerized deployment)"
    fi

    # Check kubectl (for Kubernetes deployments)
    if command -v kubectl &> /dev/null; then
        log_success "kubectl installed"
    else
        log_warning "kubectl not found (required for Kubernetes deployment)"
    fi
}

# ============================================
# PROJECT STRUCTURE CHECKS
# ============================================
check_project_structure() {
    header "Project Structure"

    # Required directories
    DIRS=("apps/key" "apps/portal" "apps/vendor" "packages/db" "services/gateway" "services/core")

    for dir in "${DIRS[@]}"; do
        if [ -d "$dir" ]; then
            log_success "$dir exists"
        else
            log_error "$dir directory missing"
        fi
    done

    # Required files
    FILES=("package.json" "pnpm-lock.yaml" "turbo.json" "packages/db/prisma/schema.prisma")

    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            log_success "$file exists"
        else
            log_error "$file missing"
        fi
    done
}

# ============================================
# DEPENDENCY CHECKS
# ============================================
check_dependencies() {
    header "Dependencies"

    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        log_success "node_modules installed"
    else
        log_error "node_modules missing - run 'pnpm install'"
    fi

    # Check Prisma client
    if [ -d "node_modules/.prisma/client" ]; then
        log_success "Prisma client generated"
    else
        log_warning "Prisma client not generated - run 'pnpm db:generate'"
    fi

    # Check Go modules in services
    for service in gateway core vessel realtime notification; do
        if [ -f "services/$service/go.mod" ]; then
            if [ -d "services/$service/vendor" ] || [ -f "services/$service/go.sum" ]; then
                log_success "services/$service Go modules ready"
            else
                log_warning "services/$service may need 'go mod download'"
            fi
        fi
    done
}

# ============================================
# BUILD CHECKS
# ============================================
check_builds() {
    header "Build Validation"

    log_info "Running TypeScript check..."
    if pnpm typecheck 2>/dev/null; then
        log_success "TypeScript compilation successful"
    else
        log_error "TypeScript errors found - run 'pnpm typecheck' to see details"
    fi

    log_info "Running linter..."
    if pnpm lint 2>/dev/null; then
        log_success "Linting passed"
    else
        log_warning "Lint warnings/errors found - run 'pnpm lint' to see details"
    fi

    # Check Go builds
    log_info "Validating Go services..."
    for service in gateway core vessel realtime notification; do
        if [ -f "services/$service/cmd/main.go" ]; then
            if (cd services/$service && go build -o /dev/null ./cmd/main.go 2>/dev/null); then
                log_success "services/$service builds successfully"
            else
                log_error "services/$service build failed"
            fi
        fi
    done
}

# ============================================
# SECURITY CHECKS
# ============================================
check_security() {
    header "Security Validation"

    # Check for .env in git
    if grep -q "\.env$" .gitignore 2>/dev/null; then
        log_success ".env is gitignored"
    else
        log_error ".env not in .gitignore - secrets could be committed!"
    fi

    # Check for hardcoded secrets
    log_info "Scanning for potential hardcoded secrets..."

    # Look for common secret patterns (simplified check)
    if grep -rn "password.*=.*['\"]" --include="*.go" --include="*.ts" --include="*.tsx" \
        --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "password.*=.*['\"]\"" | head -5; then
        log_warning "Potential hardcoded passwords found - review above files"
    else
        log_success "No obvious hardcoded secrets found"
    fi

    # Check JWT minimum length requirement
    if grep -q "MinSecretLength.*=.*32" pkg/auth/jwt.go 2>/dev/null; then
        log_success "JWT minimum secret length enforced (32 chars)"
    else
        log_warning "Verify JWT_SECRET minimum length is enforced"
    fi

    # Check SSL mode in database
    if grep -q "sslmode=require" pkg/database/postgres.go 2>/dev/null || \
       grep -q '"require"' pkg/database/postgres.go 2>/dev/null; then
        log_success "Database SSL mode defaults to require"
    else
        log_warning "Verify DATABASE_URL uses sslmode=require in production"
    fi
}

# ============================================
# DATABASE CHECKS
# ============================================
check_database() {
    header "Database Configuration"

    # Check schema
    if [ -f "packages/db/prisma/schema.prisma" ]; then
        log_success "Prisma schema exists"

        # Check for required models
        MODELS=("Organization" "User" "Workspace" "UserWorkspace" "PortCall" "Vessel")
        for model in "${MODELS[@]}"; do
            if grep -q "model $model" packages/db/prisma/schema.prisma; then
                log_success "Model $model defined"
            else
                log_error "Model $model missing from schema"
            fi
        done
    else
        log_error "Prisma schema not found"
    fi

    # Check RLS migration
    if [ -f "packages/db/migrations/001_add_rls_policies.sql" ]; then
        log_success "RLS migration exists"
    else
        log_warning "RLS migration not found - multi-tenant security may be incomplete"
    fi

    # Check seed file
    if [ -f "packages/db/prisma/seed.ts" ]; then
        log_success "Database seed file exists"
    else
        log_warning "No seed file found - you may need initial data"
    fi
}

# ============================================
# DOCKER CHECKS
# ============================================
check_docker() {
    header "Docker Configuration"

    # Check Dockerfiles
    SERVICES=("gateway" "core" "vessel" "realtime" "notification")

    for service in "${SERVICES[@]}"; do
        if [ -f "services/$service/Dockerfile" ]; then
            log_success "services/$service Dockerfile exists"

            # Check for security best practices
            if grep -q "USER.*appuser\|USER.*nonroot" "services/$service/Dockerfile" 2>/dev/null; then
                log_success "services/$service uses non-root user"
            else
                log_warning "services/$service may not use non-root user"
            fi
        else
            log_error "services/$service Dockerfile missing"
        fi
    done

    # Check docker-compose
    if [ -f "docker-compose.yml" ]; then
        log_success "docker-compose.yml exists"
    else
        log_warning "docker-compose.yml not found"
    fi
}

# ============================================
# KUBERNETES CHECKS
# ============================================
check_kubernetes() {
    header "Kubernetes Configuration"

    K8S_DIR="deploy/k8s"

    if [ -d "$K8S_DIR" ]; then
        # Check required manifests
        MANIFESTS=("namespace.yaml" "configmap.yaml" "secrets.yaml" "gateway-deployment.yaml" "ingress.yaml")

        for manifest in "${MANIFESTS[@]}"; do
            if [ -f "$K8S_DIR/$manifest" ]; then
                log_success "$manifest exists"
            else
                log_warning "$manifest not found"
            fi
        done

        # Check external secrets
        if [ -d "$K8S_DIR/external-secrets" ]; then
            log_success "External secrets configuration exists"
        else
            log_warning "External secrets not configured"
        fi
    else
        log_warning "Kubernetes manifests directory not found"
    fi
}

# ============================================
# ENVIRONMENT VARIABLES CHECK
# ============================================
check_env_vars() {
    header "Environment Variables"

    REQUIRED_VARS=(
        "JWT_SECRET:32"
        "DATABASE_URL:10"
    )

    OPTIONAL_VARS=(
        "REDIS_URL"
        "SMTP_PASSWORD"
        "AIS_API_KEY"
    )

    log_info "Checking .env.example for required variables..."

    if [ -f ".env.example" ]; then
        log_success ".env.example exists"
        for var_spec in "${REQUIRED_VARS[@]}"; do
            var_name="${var_spec%%:*}"
            if grep -q "^$var_name=" .env.example 2>/dev/null; then
                log_success "$var_name documented in .env.example"
            else
                log_warning "$var_name not documented in .env.example"
            fi
        done
    else
        log_warning ".env.example not found - developers need environment reference"
    fi

    # Check if .env exists locally
    if [ -f ".env" ]; then
        log_success ".env file exists (local development)"
    else
        log_info ".env not found (expected in production)"
    fi
}

# ============================================
# TEST CHECKS
# ============================================
check_tests() {
    header "Tests"

    log_info "Checking for test files..."

    # Count test files
    TS_TESTS=$(find . -name "*.test.ts" -o -name "*.spec.ts" -not -path "./node_modules/*" 2>/dev/null | wc -l)
    GO_TESTS=$(find . -name "*_test.go" -not -path "./node_modules/*" 2>/dev/null | wc -l)

    if [ "$TS_TESTS" -gt 0 ]; then
        log_success "Found $TS_TESTS TypeScript test files"
    else
        log_warning "No TypeScript test files found"
    fi

    if [ "$GO_TESTS" -gt 0 ]; then
        log_success "Found $GO_TESTS Go test files"
    else
        log_warning "No Go test files found"
    fi

    # Run tests if available
    if [ "$TS_TESTS" -gt 0 ]; then
        log_info "Running TypeScript tests..."
        if pnpm test:run 2>/dev/null; then
            log_success "All TypeScript tests pass"
        else
            log_error "TypeScript tests failed"
        fi
    fi
}

# ============================================
# DOCUMENTATION CHECKS
# ============================================
check_docs() {
    header "Documentation"

    DOCS=(
        "docs/README.md"
        "docs/deployment/production.md"
        "docs/deployment/secrets-management.md"
        "docs/architecture/overview.md"
        "docs/api/README.md"
    )

    for doc in "${DOCS[@]}"; do
        if [ -f "$doc" ]; then
            log_success "$doc exists"
        else
            log_warning "$doc missing"
        fi
    done
}

# ============================================
# SUMMARY
# ============================================
print_summary() {
    header "Pre-Flight Summary"

    echo ""
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}┌─────────────────────────────────────────────┐${NC}"
        echo -e "${GREEN}│  ✓ ALL CHECKS PASSED - Ready for deployment │${NC}"
        echo -e "${GREEN}└─────────────────────────────────────────────┘${NC}"
    elif [ $ERRORS -eq 0 ]; then
        echo -e "${YELLOW}┌─────────────────────────────────────────────┐${NC}"
        echo -e "${YELLOW}│  ⚠ $WARNINGS warning(s) - Review before deployment │${NC}"
        echo -e "${YELLOW}└─────────────────────────────────────────────┘${NC}"
    else
        echo -e "${RED}┌─────────────────────────────────────────────┐${NC}"
        echo -e "${RED}│  ✗ $ERRORS error(s), $WARNINGS warning(s) - Fix before deploy │${NC}"
        echo -e "${RED}└─────────────────────────────────────────────┘${NC}"
    fi

    echo ""
    echo "Errors:   $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""

    if [ $ERRORS -gt 0 ]; then
        exit 1
    fi
}

# ============================================
# MAIN
# ============================================
main() {
    echo ""
    echo "┌─────────────────────────────────────────────┐"
    echo "│    Navo Pre-Deployment Validation           │"
    echo "│    Environment: $ENVIRONMENT                       │"
    echo "└─────────────────────────────────────────────┘"

    check_environment
    check_project_structure
    check_dependencies
    check_security
    check_database
    check_docker
    check_kubernetes
    check_env_vars
    check_docs

    # Optional: run builds and tests (slower)
    if [ "${RUN_BUILDS:-false}" = "true" ]; then
        check_builds
        check_tests
    fi

    print_summary
}

main "$@"
