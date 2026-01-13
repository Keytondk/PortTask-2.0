# Navo Developer Guide

Welcome to the Navo development team! This guide will help you get up to speed with our codebase, development practices, and contribution workflow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Development Setup](#development-setup)
4. [Code Style and Standards](#code-style-and-standards)
5. [Working with Services](#working-with-services)
6. [Working with Frontend](#working-with-frontend)
7. [Testing](#testing)
8. [Git Workflow](#git-workflow)
9. [Common Tasks](#common-tasks)
10. [Resources](#resources)

---

## Project Overview

Navo is an enterprise maritime operations platform built with:

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Go 1.22, Chi router
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Real-time**: WebSockets

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Organization** | A tenant (company) in the system |
| **Workspace** | Logical grouping within an organization |
| **Port Call** | A vessel's visit to a port |
| **Service Order** | A service request for a port call |
| **RFQ** | Request for quotation to vendors |

---

## Repository Structure

```
navo/
├── apps/                    # Frontend applications
│   ├── key/                 # Main operator app
│   ├── portal/              # Customer portal
│   └── vendor/              # Vendor app
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── shared/              # Shared utilities
│   └── db/                  # Prisma schema
├── services/                # Go microservices
│   ├── gateway/             # API Gateway
│   ├── auth/                # Authentication
│   ├── core/                # Port calls, services
│   ├── vessel/              # Vessel tracking
│   ├── realtime/            # WebSocket server
│   ├── notification/        # Notifications
│   ├── analytics/           # Analytics
│   └── worker/              # Background jobs
├── pkg/                     # Shared Go packages
│   ├── auth/                # JWT handling
│   ├── database/            # DB connection
│   ├── logger/              # Structured logging
│   └── ...
├── docs/                    # Documentation
└── scripts/                 # Build scripts
```

---

## Development Setup

### Quick Start

```bash
# Clone repository
git clone https://github.com/navo-io/navo.git
cd navo

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d postgres redis

# Setup environment
cp .env.example .env

# Run migrations
pnpm --filter @navo/db db:push
pnpm --filter @navo/db db:seed

# Start services (in separate terminals)
cd services/gateway && go run cmd/main.go
cd services/auth && go run cmd/main.go
cd services/core && go run cmd/main.go

# Start frontend
pnpm --filter @navo/key dev
```

See [Local Setup Guide](../deployment/local-setup.md) for detailed instructions.

---

## Code Style and Standards

### TypeScript/JavaScript

We use ESLint and Prettier for consistent code style.

```bash
# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm typecheck
```

**Key Rules:**
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript strict mode
- No `any` types (use `unknown` if needed)

**Example Component:**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { PortCall } from '@/types';
import { api } from '@/lib/api';

interface PortCallListProps {
  workspaceId: string;
  onSelect?: (portCall: PortCall) => void;
}

export function PortCallList({ workspaceId, onSelect }: PortCallListProps) {
  const [portCalls, setPortCalls] = useState<PortCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortCalls() {
      try {
        setLoading(true);
        const response = await api.portCalls.list({ workspace_id: workspaceId });
        setPortCalls(response.data);
      } catch (err) {
        setError('Failed to load port calls');
      } finally {
        setLoading(false);
      }
    }
    fetchPortCalls();
  }, [workspaceId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ul className="divide-y divide-border">
      {portCalls.map((portCall) => (
        <PortCallItem
          key={portCall.id}
          portCall={portCall}
          onClick={() => onSelect?.(portCall)}
        />
      ))}
    </ul>
  );
}
```

### Go

We use `golangci-lint` for linting and `gofmt` for formatting.

```bash
# Lint
golangci-lint run

# Format
gofmt -w .
```

**Key Rules:**
- Follow effective Go patterns
- Use context for cancellation
- Handle all errors
- Use structured logging

**Example Handler:**

```go
package handler

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/navo/pkg/response"
    "github.com/navo/services/core/internal/middleware"
    "github.com/navo/services/core/internal/service"
)

type PortCallHandler struct {
    svc *service.PortCallService
}

func NewPortCallHandler(svc *service.PortCallService) *PortCallHandler {
    return &PortCallHandler{svc: svc}
}

func (h *PortCallHandler) Get(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    id := chi.URLParam(r, "id")

    // Get user context
    userID := middleware.GetUserID(ctx)
    orgID := middleware.GetOrganizationID(ctx)

    // Fetch port call
    portCall, err := h.svc.GetByID(ctx, id, orgID)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            response.NotFound(w, "Port call not found")
            return
        }
        response.InternalError(w, "Failed to get port call")
        return
    }

    response.JSON(w, http.StatusOK, portCall)
}

func (h *PortCallHandler) Create(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    var input service.CreatePortCallInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        response.BadRequest(w, "Invalid request body")
        return
    }

    // Set user context
    input.CreatedBy = middleware.GetUserID(ctx)
    input.OrganizationID = middleware.GetOrganizationID(ctx)

    portCall, err := h.svc.Create(ctx, input)
    if err != nil {
        response.InternalError(w, "Failed to create port call")
        return
    }

    response.JSON(w, http.StatusCreated, portCall)
}
```

---

## Working with Services

### Service Architecture

Each Go service follows this structure:

```
services/core/
├── cmd/
│   └── main.go              # Entry point
└── internal/
    ├── config/
    │   └── config.go        # Configuration
    ├── model/
    │   └── portcall.go      # Domain models
    ├── repository/
    │   └── portcall.go      # Data access
    ├── service/
    │   └── portcall.go      # Business logic
    ├── handler/
    │   └── portcall.go      # HTTP handlers
    └── middleware/
        └── context.go       # Request middleware
```

### Adding a New Endpoint

1. **Define the model** (`internal/model/`)

```go
type Document struct {
    ID             string    `json:"id"`
    Name           string    `json:"name"`
    OrganizationID string    `json:"organization_id"`
    CreatedAt      time.Time `json:"created_at"`
}
```

2. **Create repository** (`internal/repository/`)

```go
type DocumentRepository struct {
    pool *pgxpool.Pool
}

func (r *DocumentRepository) Create(ctx context.Context, doc *model.Document) error {
    query := `INSERT INTO documents (id, name, organization_id) VALUES ($1, $2, $3)`
    _, err := r.pool.Exec(ctx, query, doc.ID, doc.Name, doc.OrganizationID)
    return err
}
```

3. **Implement service** (`internal/service/`)

```go
type DocumentService struct {
    repo   *repository.DocumentRepository
    audit  audit.Logger
}

func (s *DocumentService) Create(ctx context.Context, input CreateDocumentInput) (*model.Document, error) {
    doc := &model.Document{
        ID:             uuid.New().String(),
        Name:           input.Name,
        OrganizationID: input.OrganizationID,
    }

    if err := s.repo.Create(ctx, doc); err != nil {
        return nil, err
    }

    // Audit log
    s.audit.LogAsync(ctx, audit.NewBuilder().
        WithAction(audit.ActionCreate).
        WithEntity(audit.EntityDocument, doc.ID).
        Build())

    return doc, nil
}
```

4. **Add handler** (`internal/handler/`)

```go
func (h *DocumentHandler) Create(w http.ResponseWriter, r *http.Request) {
    // Implementation
}
```

5. **Register route** (`cmd/main.go` or router)

```go
r.Route("/documents", func(r chi.Router) {
    r.Post("/", documentHandler.Create)
    r.Get("/{id}", documentHandler.Get)
})
```

---

## Working with Frontend

### Component Library

We have shared UI components in `packages/ui/`:

```tsx
import { Button, Card, Input, Select } from '@navo/ui';
```

### State Management

- **Server State**: TanStack Query
- **Client State**: Zustand stores

**TanStack Query Example:**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function usePortCalls(workspaceId: string) {
  return useQuery({
    queryKey: ['port-calls', workspaceId],
    queryFn: () => api.portCalls.list({ workspace_id: workspaceId }),
  });
}

function useCreatePortCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortCallInput) => api.portCalls.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['port-calls'] });
    },
  });
}
```

**Zustand Store Example:**

```tsx
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### Styling

We use Tailwind CSS with custom design tokens:

```tsx
// Use semantic color tokens
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Click me
  </button>
</div>
```

---

## Testing

### Frontend Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

**Component Test Example:**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PortCallCard } from './PortCallCard';

describe('PortCallCard', () => {
  const mockPortCall = {
    id: '1',
    reference: 'PC-001',
    status: 'confirmed',
    vessel: { name: 'Test Vessel' },
  };

  it('renders port call information', () => {
    render(<PortCallCard portCall={mockPortCall} />);

    expect(screen.getByText('PC-001')).toBeInTheDocument();
    expect(screen.getByText('Test Vessel')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<PortCallCard portCall={mockPortCall} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockPortCall);
  });
});
```

### Backend Tests

```bash
# Run all tests
cd services/core && go test ./...

# With coverage
go test -cover ./...

# Verbose
go test -v ./...
```

**Service Test Example:**

```go
func TestPortCallService_Create(t *testing.T) {
    // Setup
    ctx := context.Background()
    repo := &mockRepository{}
    svc := service.NewPortCallService(repo)

    input := service.CreatePortCallInput{
        Reference: "PC-001",
        VesselID:  "v-123",
        PortID:    "p-456",
    }

    // Execute
    result, err := svc.Create(ctx, input)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "PC-001", result.Reference)
    assert.NotEmpty(t, result.ID)
}
```

---

## Git Workflow

### Branch Naming

```
feature/add-document-upload
bugfix/fix-login-redirect
hotfix/security-patch
chore/update-dependencies
```

### Commit Messages

Follow conventional commits:

```
feat: add document upload functionality
fix: resolve login redirect issue
docs: update API documentation
chore: upgrade dependencies
refactor: simplify port call validation
test: add integration tests for RFQ
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with tests
3. Run linting and tests locally
4. Push and create PR
5. Request review
6. Address feedback
7. Squash and merge

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Documentation updated
- [ ] No console.log or debug code
```

---

## Common Tasks

### Adding a Database Migration

```bash
# Create migration
pnpm --filter @navo/db db:migrate:dev --name add_documents_table

# Apply migration
pnpm --filter @navo/db db:push
```

### Adding a New API Endpoint

1. Add handler in service
2. Register route
3. Update OpenAPI spec
4. Add frontend API client method
5. Write tests

### Adding a New UI Component

1. Create component in `packages/ui/`
2. Export from `packages/ui/index.ts`
3. Write Storybook story
4. Add tests

### Debugging

**Frontend:**
```tsx
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app
<ReactQueryDevtools initialIsOpen={false} />
```

**Backend:**
```go
// Add debug logging
logger.Debug("Processing request",
    zap.String("user_id", userID),
    zap.String("action", "create_port_call"),
)
```

---

## Resources

### Documentation

- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/README.md)
- [Security Guide](../architecture/security.md)
- [Deployment Guide](../deployment/production.md)

### External Resources

- [Go Documentation](https://go.dev/doc/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Chi Router](https://github.com/go-chi/chi)

### Getting Help

- **Slack**: #navo-dev
- **Email**: dev-team@navo.io
- **Wiki**: Internal Confluence

---

## Onboarding Checklist

- [ ] Repository access granted
- [ ] Development environment setup
- [ ] Successfully run all services locally
- [ ] Access to staging environment
- [ ] Joined Slack channels
- [ ] Read architecture documentation
- [ ] Completed first PR
