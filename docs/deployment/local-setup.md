# Navo Local Development Setup

This guide walks you through setting up the Navo platform for local development.

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Frontend and tooling |
| pnpm | 8.x | Package manager |
| Go | 1.22+ | Backend services |
| Docker | 24.x | Database and Redis |
| PostgreSQL | 16.x | Database (via Docker) |
| Redis | 7.x | Caching (via Docker) |

### Installation

#### Node.js (via nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 20
nvm use 20
```

#### pnpm

```bash
npm install -g pnpm
```

#### Go

Download from https://go.dev/dl/ or use a package manager:

```bash
# macOS
brew install go

# Ubuntu/Debian
sudo apt install golang-go

# Windows (via Chocolatey)
choco install golang
```

#### Docker

Download Docker Desktop from https://www.docker.com/products/docker-desktop

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/navo-io/navo.git
cd navo
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend and tools)
pnpm install

# Download Go dependencies for all services
cd services/gateway && go mod download && cd ../..
cd services/auth && go mod download && cd ../..
cd services/core && go mod download && cd ../..
cd services/vessel && go mod download && cd ../..
cd services/realtime && go mod download && cd ../..
cd services/notification && go mod download && cd ../..
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis
```

### 4. Setup Environment

```bash
# Copy environment files
cp .env.example .env
cp apps/key/.env.example apps/key/.env.local
cp apps/portal/.env.example apps/portal/.env.local
cp apps/vendor/.env.example apps/vendor/.env.local
```

### 5. Setup Database

```bash
# Run migrations
pnpm --filter @navo/db db:push

# Seed initial data
pnpm --filter @navo/db db:seed
```

### 6. Start Services

Open multiple terminals:

```bash
# Terminal 1: Gateway
cd services/gateway && go run cmd/main.go

# Terminal 2: Auth Service
cd services/auth && go run cmd/main.go

# Terminal 3: Core Service
cd services/core && go run cmd/main.go

# Terminal 4: Vessel Service
cd services/vessel && go run cmd/main.go

# Terminal 5: Realtime Service
cd services/realtime && go run cmd/main.go

# Terminal 6: Key App
pnpm --filter @navo/key dev

# Terminal 7: Portal App
pnpm --filter @navo/portal dev

# Terminal 8: Vendor App
pnpm --filter @navo/vendor dev
```

### 7. Access Applications

| Application | URL |
|-------------|-----|
| Key App | http://localhost:3000 |
| Portal App | http://localhost:3001 |
| Vendor App | http://localhost:3002 |
| API Gateway | http://localhost:4000 |

---

## Detailed Setup

### Environment Variables

#### Root `.env`

```bash
# Database
DATABASE_URL=postgres://navo:navo@localhost:5432/navo?sslmode=disable
DB_SSL_MODE=disable

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# Services (for gateway routing)
AUTH_SERVICE_URL=http://localhost:4001
CORE_SERVICE_URL=http://localhost:4002
VESSEL_SERVICE_URL=http://localhost:4003
REALTIME_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Environment
GO_ENV=development
```

#### Frontend Apps `.env.local`

```bash
# apps/key/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_AUTH_URL=http://localhost:4000/api/v1/auth
NEXT_PUBLIC_WS_URL=ws://localhost:4004/ws
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### Docker Compose

The `docker-compose.yml` provides all infrastructure:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: navo
      POSTGRES_PASSWORD: navo
      POSTGRES_DB: navo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U navo"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Optional: MinIO for S3-compatible storage
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Database Management

```bash
# View Prisma Studio (visual database browser)
pnpm --filter @navo/db db:studio

# Reset database (drops all data)
pnpm --filter @navo/db db:reset

# Create new migration
pnpm --filter @navo/db db:migrate:dev --name add_new_table

# Format schema
pnpm --filter @navo/db db:format
```

---

## Development Workflow

### Running Tests

```bash
# Frontend tests
pnpm test

# Go service tests
cd services/core && go test ./...

# All Go tests
for dir in services/*/; do
  cd "$dir" && go test ./... && cd ../..
done
```

### Code Quality

```bash
# Lint frontend
pnpm lint

# Format frontend
pnpm format

# Type check
pnpm typecheck

# Go linting
cd services/gateway && golangci-lint run
```

### Building

```bash
# Build all frontend apps
pnpm build

# Build specific app
pnpm --filter @navo/key build

# Build Go service
cd services/gateway && go build -o bin/gateway cmd/main.go
```

---

## Hot Reloading

### Frontend

Next.js provides automatic hot reloading. Changes to components, pages, and styles are reflected immediately.

### Backend

For Go services, use `air` for hot reloading:

```bash
# Install air
go install github.com/cosmtrek/air@latest

# Run with hot reload
cd services/gateway && air
```

Create `.air.toml` in each service:

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/main ./cmd/main.go"
  bin = "tmp/main"
  include_ext = ["go", "tpl", "tmpl", "html"]
  exclude_dir = ["tmp", "vendor"]
  delay = 1000

[log]
  time = false

[color]
  main = "yellow"
  watcher = "cyan"
  build = "green"
  runner = "magenta"
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgres://navo:navo@localhost:5432/navo

# View logs
docker logs navo-postgres-1
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

### Go Module Issues

```bash
# Clean Go module cache
go clean -modcache

# Re-download dependencies
go mod download
```

### Docker Issues

```bash
# Reset Docker environment
docker compose down -v
docker compose up -d

# Rebuild containers
docker compose build --no-cache
```

---

## IDE Setup

### VS Code

Recommended extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "golang.go",
    "prisma.prisma",
    "ms-azuretools.vscode-docker"
  ]
}
```

Settings:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.formatOnSave": true
  },
  "go.lintTool": "golangci-lint",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### GoLand / IntelliJ

1. Open project root
2. Mark `services/*` as Go modules
3. Enable "Format on Save"
4. Configure golangci-lint as external tool

---

## Test Accounts

The seed script creates test accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@navo.io | password123 | Admin |
| manager@navo.io | password123 | Manager |
| operator@navo.io | password123 | Operator |
| viewer@navo.io | password123 | Viewer |

---

## Next Steps

- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/README.md)
- [Production Deployment](./production.md)
