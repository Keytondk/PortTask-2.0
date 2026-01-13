# Navo

**The Nerve Center for Maritime Operations**

Navo is a next-generation maritime operations platform that unifies vessel management, port call coordination, vendor procurement, and stakeholder collaboration into a single, intelligent system.

---

## Platform Architecture

Navo consists of three interconnected portals:

| Portal | App | Description |
|--------|-----|-------------|
| **Key** | `apps/key` | Main platform for internal operators |
| **Portal** | `apps/portal` | Operations portal for customers, crew, and agents |
| **Vendor** | `apps/vendor` | Vendor portal for service providers |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **State** | Zustand + React Query |
| **Forms** | React Hook Form + Zod |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **API** | tRPC / REST |
| **Real-time** | Socket.io |
| **Maps** | Mapbox GL JS |
| **Charts** | Recharts |

---

## Project Structure

```
navo/
├── apps/
│   ├── key/                 # Main platform (key.domain.com)
│   │   └── src/
│   │       ├── app/         # Next.js app router pages
│   │       ├── components/  # App-specific components
│   │       ├── hooks/       # Custom hooks
│   │       ├── lib/         # Utilities
│   │       ├── stores/      # Zustand stores
│   │       └── types/       # TypeScript types
│   │
│   ├── portal/              # Operations portal (portal.domain.com)
│   │   └── src/
│   │       └── ...          # Same structure as key
│   │
│   └── vendor/              # Vendor portal (vendor.domain.com)
│       └── src/
│           └── ...          # Same structure as key
│
├── packages/
│   ├── ui/                  # Shared UI component library
│   │   └── src/
│   │       ├── components/  # Reusable components
│   │       └── styles/      # Shared styles
│   │
│   ├── api/                 # Backend API
│   │   └── src/
│   │       ├── routes/      # API routes
│   │       ├── services/    # Business logic
│   │       ├── middleware/  # Auth, logging, etc.
│   │       └── utils/       # Helpers
│   │
│   ├── db/                  # Database package
│   │   └── src/
│   │       ├── schema/      # Prisma schema
│   │       ├── migrations/  # Database migrations
│   │       └── seeds/       # Seed data
│   │
│   └── shared/              # Shared utilities
│       └── src/
│           ├── types/       # Shared TypeScript types
│           ├── utils/       # Shared utilities
│           └── constants/   # Shared constants
│
└── docs/                    # Documentation
    ├── frontend-design.md   # UI/UX specification
    ├── executive-summary.md # Business overview
    └── technical-specification.md # Technical details
```

---

## Portals Overview

### Key (Main Platform)
Internal operators' command center with full control over:
- Command: Situational awareness, incidents, communications
- Plan: Workspaces, voyages, scheduling
- Execute: Port calls, RFQs, vessels, live operations
- Vendors: Network, verification, outbound
- Analyze: Reports, usage, predictions, benchmarks
- Configure: Settings, users, automation, integrations

### Portal (Operations Portal)
Role-based access for external stakeholders:
- **Customers**: Fleet tracking, voyage visibility, approvals
- **Crew/Masters**: Port call management, requests, agent coordination
- **Agents**: Task management, document uploads, communications

### Vendor (Vendor Portal)
Service provider interface for:
- RFQ response and quote submission
- Order management and status updates
- Performance tracking and ratings
- Profile and capability management

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis (for caching/real-time)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd navo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed the database
pnpm db:seed

# Start development servers
pnpm dev
```

### Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=key
pnpm dev --filter=portal
pnpm dev --filter=vendor

# Run tests
pnpm test

# Build for production
pnpm build

# Lint
pnpm lint
```

---

## Documentation

- [Frontend Design Specification](docs/frontend-design.md)
- [Executive Summary](docs/executive-summary.md)
- [Technical Specification](docs/technical-specification.md)

---

## Domain Configuration

Domains will be configured during deployment:

| Portal | Subdomain |
|--------|-----------|
| Key | `key.<domain>` |
| Portal | `portal.<domain>` |
| Vendor | `vendor.<domain>` |

---

## License

Proprietary - All rights reserved.
