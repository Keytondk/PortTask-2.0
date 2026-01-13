# Navo Maritime Operations Platform - Architecture Overview

## Table of Contents

1. [Introduction](#introduction)
2. [Business Context](#business-context)
3. [Design Principles](#design-principles)
4. [System Architecture](#system-architecture)
5. [Component Architecture](#component-architecture)
6. [Frontend Applications](#frontend-applications)
7. [Backend Services](#backend-services)
8. [Shared Packages](#shared-packages)
9. [Data Architecture](#data-architecture)
10. [Integration Architecture](#integration-architecture)
11. [Security Architecture](#security-architecture)
12. [Infrastructure Architecture](#infrastructure-architecture)
13. [Deployment Architecture](#deployment-architecture)
14. [Scalability and Performance](#scalability-and-performance)
15. [Monitoring and Observability](#monitoring-and-observability)
16. [Disaster Recovery](#disaster-recovery)
17. [Technology Decisions](#technology-decisions)
18. [Future Considerations](#future-considerations)

---

## Introduction

### What is Navo?

Navo is an enterprise-grade, operations-critical maritime SaaS platform designed to handle multi-billion dollar scale operations. The platform enables shipping companies, port operators, and maritime service providers to efficiently manage:

- **Vessel Operations**: Track fleet movements, schedules, and status
- **Port Calls**: Manage vessel arrivals, departures, and berth assignments
- **Service Ordering**: Request, quote, and fulfill port services
- **Vendor Management**: Handle RFQ workflows and vendor relationships
- **Real-time Tracking**: Monitor vessels via AIS integration
- **Analytics**: Generate operational insights and reports

### Target Users

| User Type | Description | Primary App |
|-----------|-------------|-------------|
| **Port Agents** | Coordinate vessel arrivals and services | Key App |
| **Operations Managers** | Oversee port operations and resources | Key App |
| **Dispatchers** | Assign services and manage schedules | Key App |
| **Ship Owners/Charterers** | Monitor fleet and approve services | Portal App |
| **Fleet Managers** | Track vessel positions and schedules | Portal App |
| **Service Vendors** | Respond to RFQs and manage orders | Vendor App |
| **Suppliers** | Provide services and submit invoices | Vendor App |

### Key Constraints

The platform operates under several critical constraints:

1. **No Financial/Billing Features**: Pure operations focus; billing handled externally
2. **Multi-Tenant Architecture**: Complete data isolation between organizations
3. **Feature Customization**: Per-tenant feature flags for customization
4. **High Availability**: 99.9% uptime SLA requirement
5. **Real-Time Updates**: Sub-second latency for position updates
6. **Regulatory Compliance**: GDPR, maritime industry standards

---

## Business Context

### Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MARITIME OPERATIONS DOMAIN                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   VESSELS    │    │    PORTS     │    │   VENDORS    │                   │
│  │              │    │              │    │              │                   │
│  │ - Fleet      │    │ - Terminals  │    │ - Agents     │                   │
│  │ - Positions  │    │ - Berths     │    │ - Suppliers  │                   │
│  │ - Schedules  │    │ - Facilities │    │ - Services   │                   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                   │                           │
│         └─────────┬─────────┴─────────┬─────────┘                           │
│                   │                   │                                     │
│           ┌───────▼───────┐   ┌───────▼───────┐                             │
│           │  PORT CALLS   │   │    SERVICES   │                             │
│           │               │   │               │                             │
│           │ - Arrivals    │───│ - Orders      │                             │
│           │ - Departures  │   │ - RFQs        │                             │
│           │ - Berth Ops   │   │ - Quotes      │                             │
│           └───────────────┘   └───────────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Bounded Contexts

The platform is organized into distinct bounded contexts:

| Context | Responsibility | Services |
|---------|---------------|----------|
| **Identity & Access** | Authentication, authorization, user management | Auth Service |
| **Operations** | Port calls, services, RFQs, vendors | Core Service |
| **Fleet Management** | Vessels, positions, tracking | Vessel Service |
| **Communication** | Notifications, real-time updates | Notification, Realtime |
| **Intelligence** | Analytics, reporting, insights | Analytics Service |
| **Integration** | External systems, AIS providers | Integration Service |

### User Journeys

#### Port Call Lifecycle

```
1. PLANNING
   └─→ Create port call with vessel, port, ETA
   └─→ Request berth allocation
   └─→ Order required services

2. CONFIRMATION
   └─→ Confirm berth assignment
   └─→ Assign port agent
   └─→ Finalize service orders
   └─→ Send notifications to stakeholders

3. ARRIVAL
   └─→ Record actual arrival time
   └─→ Update vessel position
   └─→ Begin service execution

4. OPERATIONS
   └─→ Track service completion
   └─→ Handle service changes
   └─→ Manage vendor communication

5. DEPARTURE
   └─→ Record departure time
   └─→ Complete all services
   └─→ Generate port call summary

6. COMPLETION
   └─→ Finalize documentation
   └─→ Archive port call
   └─→ Update analytics
```

---

## Design Principles

### 1. Multi-Tenancy First

Every piece of data is scoped to an organization (tenant). This is enforced at multiple levels:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MULTI-TENANCY LAYERS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Application Layer                                              │
│  ├── JWT claims include organization_id                         │
│  ├── All queries filtered by organization                       │
│  └── Context propagation through service calls                  │
│                                                                 │
│  API Layer                                                      │
│  ├── Organization extracted from token                          │
│  ├── Workspace validation middleware                            │
│  └── Request headers carry tenant context                       │
│                                                                 │
│  Database Layer                                                 │
│  ├── Row-Level Security (RLS) policies                          │
│  ├── All tables have organization_id column                     │
│  └── Session variables for tenant context                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Details:**

```go
// Context extraction middleware
func ExtractUserContext(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        // Extract from JWT claims (set by gateway)
        if userID := r.Header.Get("X-User-ID"); userID != "" {
            ctx = context.WithValue(ctx, UserIDKey, userID)
        }
        if orgID := r.Header.Get("X-Organization-ID"); orgID != "" {
            ctx = context.WithValue(ctx, OrganizationIDKey, orgID)
        }
        if workspaceID := r.Header.Get("X-Workspace-ID"); workspaceID != "" {
            ctx = context.WithValue(ctx, WorkspaceIDKey, workspaceID)
        }

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Database RLS policy
// CREATE POLICY tenant_isolation ON port_calls
//     USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### 2. Security by Default

Security is not an afterthought but a foundational requirement:

| Principle | Implementation |
|-----------|----------------|
| **No Hardcoded Secrets** | Environment variables, Kubernetes secrets |
| **Encryption in Transit** | TLS 1.2+ everywhere, mTLS between services |
| **Encryption at Rest** | Database TDE, S3 SSE-KMS |
| **Defense in Depth** | Multiple security layers |
| **Least Privilege** | Role-based access, minimal permissions |
| **Audit Everything** | Comprehensive audit logging |
| **Fail Secure** | Errors don't expose sensitive data |

### 3. Modularity and Independence

Each service is independently deployable with clear boundaries:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE BOUNDARIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Service   │  │   Service   │  │   Service   │              │
│  │      A      │  │      B      │  │      C      │              │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤              │
│  │ Own Database│  │ Own Database│  │ Own Database│              │
│  │ (Logical)   │  │ (Logical)   │  │ (Logical)   │              │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤              │
│  │ Own API     │  │ Own API     │  │ Own API     │              │
│  │ Contract    │  │ Contract    │  │ Contract    │              │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤              │
│  │ Independent │  │ Independent │  │ Independent │              │
│  │ Deployment  │  │ Deployment  │  │ Deployment  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                    ┌─────▼─────┐                                 │
│                    │  Message  │                                 │
│                    │   Bus     │                                 │
│                    │  (Redis)  │                                 │
│                    └───────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Service Interaction Patterns:**

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Synchronous HTTP** | Request/Response | Get port call details |
| **Async Events** | State changes | Port call status changed |
| **Pub/Sub** | Broadcasts | Position updates |
| **Request/Reply** | RPC-style | Validate vessel IMO |

### 4. Real-Time Operations

The platform supports real-time updates through WebSocket connections:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Clients                                                        │
│  ┌─────┐ ┌─────┐ ┌─────┐                                        │
│  │ C1  │ │ C2  │ │ C3  │  ... (thousands of clients)            │
│  └──┬──┘ └──┬──┘ └──┬──┘                                        │
│     │       │       │                                           │
│     └───────┼───────┘                                           │
│             │ WebSocket                                         │
│     ┌───────▼───────┐                                           │
│     │   Realtime    │                                           │
│     │   Service     │                                           │
│     │   (Hub)       │                                           │
│     └───────┬───────┘                                           │
│             │                                                   │
│     ┌───────▼───────┐                                           │
│     │    Redis      │                                           │
│     │   Pub/Sub     │◄──────┐                                   │
│     └───────────────┘       │                                   │
│                             │                                   │
│     ┌───────────────────────┼─────────────────────────┐         │
│     │                       │                         │         │
│  ┌──▼──┐              ┌─────▼────┐              ┌─────▼────┐    │
│  │Core │              │  Vessel  │              │Notif.    │    │
│  │Svc  │              │  Service │              │Service   │    │
│  └─────┘              └──────────┘              └──────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Feature Flags for Customization

Per-tenant feature customization without code changes:

```go
type FeatureFlag struct {
    Key                   string   // "rfq_enabled"
    DefaultValue          bool     // true
    EnabledOrganizations  []string // ["org_123", "org_456"]
    DisabledOrganizations []string // ["org_789"]
    EnabledWorkspaces     []string // Workspace-level overrides
    DisabledWorkspaces    []string
}

// Evaluation priority:
// 1. Workspace-level override (most specific)
// 2. Organization-level override
// 3. Default value
func (f *FeatureFlag) IsEnabled(orgID, workspaceID string) bool {
    // Check workspace overrides first
    if workspaceID != "" {
        if contains(f.EnabledWorkspaces, workspaceID) {
            return true
        }
        if contains(f.DisabledWorkspaces, workspaceID) {
            return false
        }
    }

    // Check organization overrides
    if contains(f.EnabledOrganizations, orgID) {
        return true
    }
    if contains(f.DisabledOrganizations, orgID) {
        return false
    }

    return f.DefaultValue
}
```

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     CLOUD LOAD BALANCER   │
                    │     (SSL Termination)     │
                    │     - AWS ALB / GCP LB    │
                    │     - DDoS Protection     │
                    │     - WAF Rules           │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   KEY APP     │       │  PORTAL APP   │       │  VENDOR APP   │
│   (Vercel)    │       │   (Vercel)    │       │   (Vercel)    │
│               │       │               │       │               │
│ - Next.js SSR │       │ - Next.js SSR │       │ - Next.js SSR │
│ - Static CDN  │       │ - Static CDN  │       │ - Static CDN  │
│ - Edge Funcs  │       │ - Edge Funcs  │       │ - Edge Funcs  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     API GATEWAY       │
                    │     (Kubernetes)      │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │   Go Service    │  │
                    │  │   - Routing     │  │
                    │  │   - Auth        │  │
                    │  │   - Rate Limit  │  │
                    │  │   - Logging     │  │
                    │  └─────────────────┘  │
                    └───────────┬───────────┘
                                │
    ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
    │           │           │       │           │           │
    ▼           ▼           ▼       ▼           ▼           ▼
┌───────┐   ┌───────┐   ┌───────┐ ┌───────┐ ┌───────┐   ┌───────┐
│ AUTH  │   │ CORE  │   │VESSEL │ │REAL-  │ │NOTIF. │   │ANALYT.│
│SERVICE│   │SERVICE│   │SERVICE│ │TIME   │ │SERVICE│   │SERVICE│
│       │   │       │   │       │ │SERVICE│ │       │   │       │
│4001   │   │4002   │   │4003   │ │4004   │ │4005   │   │4006   │
└───┬───┘   └───┬───┘   └───┬───┘ └───┬───┘ └───┬───┘   └───┬───┘
    │           │           │         │         │           │
    └───────────┴───────────┴────┬────┴─────────┴───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  POSTGRESQL   │       │     REDIS     │       │    S3/MINIO   │
│               │       │               │       │               │
│ - Primary DB  │       │ - Caching     │       │ - Documents   │
│ - Read Replicas│      │ - Sessions    │       │ - Exports     │
│ - RLS Enabled │       │ - Pub/Sub     │       │ - Backups     │
│               │       │ - Rate Limits │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK TOPOLOGY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC ZONE (Internet-Facing)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Load Balancer (443/TCP)                                            │    │
│  │  ├── TLS 1.2/1.3 termination                                        │    │
│  │  ├── HTTP/2 support                                                 │    │
│  │  └── Health check endpoints                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│  ════════════════════════════════════════════════════════════════════════   │
│                                    │                                        │
│  DMZ ZONE (Semi-Trusted)                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  API Gateway Pods                                                   │    │
│  │  ├── Ingress: 443/TCP from Load Balancer                            │    │
│  │  ├── Egress: Internal services only                                 │    │
│  │  └── No direct database access                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│  ════════════════════════════════════════════════════════════════════════   │
│                                    │                                        │
│  APPLICATION ZONE (Internal)                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Service Pods (auth, core, vessel, realtime, notification)          │    │
│  │  ├── Ingress: Gateway only (mTLS)                                   │    │
│  │  ├── Egress: Database, Redis, External APIs                         │    │
│  │  └── Inter-service: Allowed via service mesh                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│  ════════════════════════════════════════════════════════════════════════   │
│                                    │                                        │
│  DATA ZONE (Restricted)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL, Redis, S3                                              │    │
│  │  ├── Ingress: Application zone only                                 │    │
│  │  ├── Egress: None (except replication)                              │    │
│  │  └── Encrypted connections required                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW DIAGRAM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CLIENT REQUEST                                                          │
│     │                                                                       │
│     │  POST /api/v1/port-calls                                              │
│     │  Authorization: Bearer eyJhbG...                                      │
│     │  Content-Type: application/json                                       │
│     │  X-Request-ID: req_abc123                                             │
│     │                                                                       │
│     ▼                                                                       │
│  2. LOAD BALANCER                                                           │
│     │  ├── SSL termination                                                  │
│     │  ├── Connection pooling                                               │
│     │  └── Route to healthy backend                                         │
│     │                                                                       │
│     ▼                                                                       │
│  3. API GATEWAY                                                             │
│     │  ├── Parse JWT token                                                  │
│     │  ├── Validate token signature                                         │
│     │  ├── Check token expiration                                           │
│     │  ├── Extract claims (user_id, org_id, roles)                          │
│     │  ├── Apply rate limiting                                              │
│     │  ├── Add security headers                                             │
│     │  ├── Log request                                                      │
│     │  ├── Record metrics                                                   │
│     │  └── Forward to appropriate service                                   │
│     │                                                                       │
│     │  Headers added:                                                       │
│     │  X-User-ID: usr_123                                                   │
│     │  X-Organization-ID: org_456                                           │
│     │  X-User-Roles: admin,operator                                         │
│     │                                                                       │
│     ▼                                                                       │
│  4. CORE SERVICE                                                            │
│     │  ├── Extract user context from headers                                │
│     │  ├── Validate request body                                            │
│     │  ├── Check workspace authorization                                    │
│     │  ├── Set database tenant context                                      │
│     │  ├── Execute business logic                                           │
│     │  ├── Write audit log                                                  │
│     │  ├── Publish event to Redis                                           │
│     │  └── Return response                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  5. DATABASE                                                                │
│     │  ├── RLS policy filters by organization                               │
│     │  ├── Insert with organization_id                                      │
│     │  └── Return created record                                            │
│     │                                                                       │
│     ▼                                                                       │
│  6. EVENT BROADCAST (Async)                                                 │
│     │  ├── Publish to Redis: port_call:created                              │
│     │  ├── Realtime service receives event                                  │
│     │  └── Broadcast to subscribed WebSocket clients                        │
│     │                                                                       │
│     ▼                                                                       │
│  7. RESPONSE                                                                │
│     │                                                                       │
│     │  HTTP/1.1 201 Created                                                 │
│     │  Content-Type: application/json                                       │
│     │  X-Request-ID: req_abc123                                             │
│     │  X-RateLimit-Remaining: 999                                           │
│     │                                                                       │
│     │  {"data": {"id": "pc_xyz", "reference": "PC-001", ...}}               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  apps/key/                                                                  │
│  ├── src/                                                                   │
│  │   ├── app/                      # Next.js App Router                     │
│  │   │   ├── (auth)/               # Auth route group                       │
│  │   │   │   ├── login/            # Login page                             │
│  │   │   │   ├── forgot-password/  # Password recovery                      │
│  │   │   │   └── layout.tsx        # Auth layout (no sidebar)               │
│  │   │   ├── port-calls/           # Port calls feature                     │
│  │   │   │   ├── page.tsx          # List view                              │
│  │   │   │   ├── new/page.tsx      # Create form                            │
│  │   │   │   ├── [id]/             # Dynamic route                          │
│  │   │   │   │   ├── page.tsx      # Detail view                            │
│  │   │   │   │   └── edit/page.tsx # Edit form                              │
│  │   │   │   └── loading.tsx       # Loading skeleton                       │
│  │   │   ├── vessels/              # Vessels feature                        │
│  │   │   ├── services/             # Services feature                       │
│  │   │   ├── rfqs/                 # RFQs feature                           │
│  │   │   ├── vendors/              # Vendors feature                        │
│  │   │   ├── analytics/            # Analytics dashboard                    │
│  │   │   ├── fleet-map/            # Map view                               │
│  │   │   ├── documents/            # Document management                    │
│  │   │   ├── settings/             # User settings                          │
│  │   │   ├── layout.tsx            # Root layout                            │
│  │   │   └── page.tsx              # Dashboard                              │
│  │   ├── components/               # React components                       │
│  │   │   ├── layout/               # Layout components                      │
│  │   │   │   ├── Sidebar.tsx       # Navigation sidebar                     │
│  │   │   │   ├── Header.tsx        # Top header                             │
│  │   │   │   ├── Shell.tsx         # App shell wrapper                      │
│  │   │   │   └── Breadcrumbs.tsx   # Breadcrumb nav                         │
│  │   │   ├── port-calls/           # Port call components                   │
│  │   │   │   ├── PortCallCard.tsx  # List item card                         │
│  │   │   │   ├── PortCallForm.tsx  # Create/edit form                       │
│  │   │   │   ├── StatusBadge.tsx   # Status indicator                       │
│  │   │   │   ├── Timeline.tsx      # Event timeline                         │
│  │   │   │   └── WorkflowStepper.tsx # Status workflow                      │
│  │   │   ├── vessels/              # Vessel components                      │
│  │   │   ├── services/             # Service components                     │
│  │   │   ├── maps/                 # Map components                         │
│  │   │   │   ├── FleetMap.tsx      # Fleet overview map                     │
│  │   │   │   ├── VesselMarker.tsx  # Vessel position marker                 │
│  │   │   │   └── TrackLine.tsx     # Vessel track visualization             │
│  │   │   └── ui/                   # Generic UI components                  │
│  │   ├── lib/                      # Utilities                              │
│  │   │   ├── api.ts                # API client                             │
│  │   │   ├── auth.ts               # Auth utilities                         │
│  │   │   ├── utils.ts              # Helper functions                       │
│  │   │   └── constants.ts          # App constants                          │
│  │   ├── stores/                   # Zustand stores                         │
│  │   │   ├── authStore.ts          # Auth state                             │
│  │   │   ├── uiStore.ts            # UI state                               │
│  │   │   └── notificationStore.ts  # Notifications                          │
│  │   ├── hooks/                    # Custom hooks                           │
│  │   │   ├── usePortCalls.ts       # Port call queries                      │
│  │   │   ├── useVessels.ts         # Vessel queries                         │
│  │   │   ├── useWebSocket.ts       # WebSocket connection                   │
│  │   │   └── useAuth.ts            # Auth hook                              │
│  │   ├── types/                    # TypeScript types                       │
│  │   │   ├── api.ts                # API response types                     │
│  │   │   ├── models.ts             # Domain models                          │
│  │   │   └── index.ts              # Exports                                │
│  │   └── middleware.ts             # Next.js middleware                     │
│  ├── public/                       # Static assets                          │
│  ├── next.config.js                # Next.js config                         │
│  ├── tailwind.config.js            # Tailwind config                        │
│  └── package.json                  # Dependencies                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SERVER STATE                                │    │
│  │                    (TanStack Query / React Query)                   │    │
│  │                                                                     │    │
│  │  Features:                                                          │    │
│  │  • Automatic caching                                                │    │
│  │  • Background refetching                                            │    │
│  │  • Stale-while-revalidate                                           │    │
│  │  • Optimistic updates                                               │    │
│  │  • Pagination support                                               │    │
│  │  • Infinite scroll support                                          │    │
│  │                                                                     │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  Query Keys:                                                  │  │    │
│  │  │  ['port-calls']                    - List                     │  │    │
│  │  │  ['port-calls', id]                - Single                   │  │    │
│  │  │  ['port-calls', id, 'services']    - Related                  │  │    │
│  │  │  ['vessels', { workspace: id }]    - Filtered                 │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CLIENT STATE                                │    │
│  │                           (Zustand)                                 │    │
│  │                                                                     │    │
│  │  Stores:                                                            │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  authStore                                                    │  │    │
│  │  │  ├── user: User | null                                        │  │    │
│  │  │  ├── isAuthenticated: boolean                                 │  │    │
│  │  │  ├── isLoading: boolean                                       │  │    │
│  │  │  ├── login(credentials) -> Promise                            │  │    │
│  │  │  ├── logout() -> Promise                                      │  │    │
│  │  │  └── refreshUser() -> Promise                                 │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                     │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  uiStore                                                      │  │    │
│  │  │  ├── sidebarOpen: boolean                                     │  │    │
│  │  │  ├── theme: 'light' | 'dark' | 'system'                       │  │    │
│  │  │  ├── currentWorkspace: string                                 │  │    │
│  │  │  └── toggleSidebar() -> void                                  │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                     │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  notificationStore                                            │  │    │
│  │  │  ├── notifications: Notification[]                            │  │    │
│  │  │  ├── unreadCount: number                                      │  │    │
│  │  │  ├── addNotification(notif) -> void                           │  │    │
│  │  │  └── markAsRead(id) -> void                                   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         URL STATE                                   │    │
│  │                    (Next.js Router)                                 │    │
│  │                                                                     │    │
│  │  • Filters: ?status=confirmed&port=p_123                            │    │
│  │  • Pagination: ?page=2&per_page=20                                  │    │
│  │  • Sorting: ?sort=-created_at                                       │    │
│  │  • Search: ?q=vessel+name                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  services/core/                                                             │
│  ├── cmd/                                                                   │
│  │   └── main.go                   # Entry point                            │
│  │       ├── Load configuration                                             │
│  │       ├── Initialize logger                                              │
│  │       ├── Connect to database                                            │
│  │       ├── Connect to Redis                                               │
│  │       ├── Initialize repositories                                        │
│  │       ├── Initialize services                                            │
│  │       ├── Initialize handlers                                            │
│  │       ├── Setup router                                                   │
│  │       ├── Setup middleware                                               │
│  │       └── Start HTTP server                                              │
│  │                                                                          │
│  └── internal/                                                              │
│      ├── config/                                                            │
│      │   └── config.go             # Configuration management               │
│      │       ├── Load from environment                                      │
│      │       ├── Validate required fields                                   │
│      │       └── Provide typed config struct                                │
│      │                                                                      │
│      ├── model/                    # Domain models                          │
│      │   ├── portcall.go                                                    │
│      │   │   ├── PortCall struct                                            │
│      │   │   ├── PortCallStatus enum                                        │
│      │   │   ├── Validation methods                                         │
│      │   │   └── Status transition rules                                    │
│      │   ├── serviceorder.go                                                │
│      │   ├── rfq.go                                                         │
│      │   └── vendor.go                                                      │
│      │                                                                      │
│      ├── repository/               # Data access layer                      │
│      │   ├── portcall.go                                                    │
│      │   │   ├── Create(ctx, portCall) error                                │
│      │   │   ├── GetByID(ctx, id) (*PortCall, error)                        │
│      │   │   ├── List(ctx, filter) ([]PortCall, error)                      │
│      │   │   ├── Update(ctx, portCall) error                                │
│      │   │   ├── Delete(ctx, id) error                                      │
│      │   │   └── UpdateStatus(ctx, id, status) error                        │
│      │   ├── serviceorder.go                                                │
│      │   ├── rfq.go                                                         │
│      │   └── vendor.go                                                      │
│      │                                                                      │
│      ├── service/                  # Business logic layer                   │
│      │   ├── portcall.go                                                    │
│      │   │   ├── Input/Output DTOs                                          │
│      │   │   ├── Create(ctx, input) (*PortCall, error)                      │
│      │   │   │   ├── Validate input                                         │
│      │   │   │   ├── Check permissions                                      │
│      │   │   │   ├── Generate reference                                     │
│      │   │   │   ├── Create in database                                     │
│      │   │   │   ├── Write audit log                                        │
│      │   │   │   ├── Publish event                                          │
│      │   │   │   └── Return result                                          │
│      │   │   ├── UpdateStatus(ctx, id, status) error                        │
│      │   │   │   ├── Validate transition                                    │
│      │   │   │   ├── Update in database                                     │
│      │   │   │   ├── Write audit log                                        │
│      │   │   │   ├── Send notifications                                     │
│      │   │   │   └── Publish event                                          │
│      │   │   └── ...                                                        │
│      │   ├── serviceorder.go                                                │
│      │   └── rfq.go                                                         │
│      │                                                                      │
│      ├── handler/                  # HTTP handlers                          │
│      │   ├── portcall.go                                                    │
│      │   │   ├── List(w, r)                                                 │
│      │   │   │   ├── Parse query params                                     │
│      │   │   │   ├── Extract user context                                   │
│      │   │   │   ├── Call service                                           │
│      │   │   │   └── Write JSON response                                    │
│      │   │   ├── Get(w, r)                                                  │
│      │   │   ├── Create(w, r)                                               │
│      │   │   ├── Update(w, r)                                               │
│      │   │   ├── Delete(w, r)                                               │
│      │   │   └── UpdateStatus(w, r)                                         │
│      │   ├── serviceorder.go                                                │
│      │   ├── rfq.go                                                         │
│      │   └── vendor.go                                                      │
│      │                                                                      │
│      └── middleware/               # HTTP middleware                        │
│          ├── context.go            # User context extraction                │
│          ├── rls.go                # Row-level security setup               │
│          └── validation.go         # Request validation                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Applications

### Key App (Main Platform)

**Purpose**: Primary application for maritime operators and port agents

**Port**: 3000

**User Roles**: Operations managers, port agents, dispatchers, supervisors

#### Features

| Feature | Description | Components |
|---------|-------------|------------|
| **Dashboard** | Operations overview, KPIs, alerts | DashboardPage, KPICards, AlertList |
| **Port Calls** | Full CRUD, status workflow, timeline | PortCallList, PortCallForm, StatusWorkflow |
| **Services** | Service ordering, vendor assignment | ServiceOrderForm, VendorSelector |
| **RFQs** | Create RFQs, compare quotes, award | RFQForm, QuoteComparison, AwardDialog |
| **Vessels** | Fleet registry, vessel details | VesselList, VesselDetail, VesselForm |
| **Fleet Map** | Real-time vessel positions | FleetMap, VesselMarker, TrackLine |
| **Documents** | Upload, organize, share | DocumentList, FileUpload, ShareDialog |
| **Analytics** | Reports, charts, exports | AnalyticsDashboard, ReportBuilder |
| **Settings** | Profile, preferences, workspace | ProfileForm, NotificationSettings |

#### Route Structure

```
/                           # Dashboard
/port-calls                 # Port call list
/port-calls/new             # Create port call
/port-calls/[id]            # Port call detail
/port-calls/[id]/edit       # Edit port call
/vessels                    # Vessel list
/vessels/[id]               # Vessel detail
/services                   # Service orders
/services/[id]              # Service detail
/rfqs                       # RFQ list
/rfqs/new                   # Create RFQ
/rfqs/[id]                  # RFQ detail
/vendors                    # Vendor list
/vendors/[id]               # Vendor detail
/fleet-map                  # Fleet map view
/documents                  # Document library
/analytics                  # Analytics dashboard
/settings                   # User settings
/login                      # Login page
/forgot-password            # Password recovery
```

### Portal App (Customer Operations)

**Purpose**: Customer-facing portal for shipping companies to monitor their operations

**Port**: 3001

**User Roles**: Ship owners, charterers, fleet managers, finance teams

#### Features

| Feature | Description | Access Level |
|---------|-------------|--------------|
| **Dashboard** | Fleet status, upcoming calls, alerts | Read-only |
| **Port Calls** | View port call details and timeline | Read-only |
| **Services** | View services, approve/reject | Approve workflow |
| **Vessels** | Fleet overview, positions | Read-only |
| **Documents** | View shared documents | Read-only |
| **Reports** | Generate and export reports | Read + Export |
| **Approvals** | Pending approval queue | Write (approvals) |

#### Route Structure

```
/                           # Dashboard
/port-calls                 # Port call list (read-only)
/port-calls/[id]            # Port call detail
/services                   # Service list
/services/[id]              # Service detail
/vessels                    # Fleet vessels
/approvals                  # Approval queue
/documents                  # Shared documents
/reports                    # Report generation
```

### Vendor App (Service Providers)

**Purpose**: Interface for maritime service providers to manage orders and RFQs

**Port**: 3002

**User Roles**: Service vendors, suppliers, subcontractors

#### Features

| Feature | Description | Access Level |
|---------|-------------|--------------|
| **Dashboard** | Active orders, pending RFQs, metrics | Read-only |
| **RFQs** | View invitations, submit quotes | Read + Write quotes |
| **Orders** | View assigned orders, update status | Read + Status updates |
| **Profile** | Company profile, services offered | Write |
| **Documents** | Upload service documents | Write |

#### Route Structure

```
/                           # Dashboard
/rfqs                       # Active RFQ invitations
/rfqs/[id]                  # RFQ detail, submit quote
/orders                     # Assigned orders
/orders/[id]                # Order detail
/profile                    # Company profile
/documents                  # Document uploads
/settings                   # Account settings
```

---

## Backend Services

### Service Overview

| Service | Port | Responsibility | Dependencies |
|---------|------|----------------|--------------|
| **Gateway** | 4000 | Routing, auth, rate limiting | All services |
| **Auth** | 4001 | Authentication, user management | PostgreSQL |
| **Core** | 4002 | Port calls, services, RFQs | PostgreSQL, Redis |
| **Vessel** | 4003 | Vessels, positions, tracking | PostgreSQL, Redis, AIS APIs |
| **Realtime** | 4004 | WebSocket, events | Redis |
| **Notification** | 4005 | Email, push, in-app | PostgreSQL, SMTP |
| **Analytics** | 4006 | Metrics, reports | PostgreSQL, Redis |
| **Worker** | - | Background jobs | PostgreSQL, Redis |
| **Integration** | 4007 | External APIs | Various |

### API Gateway

**Location**: `services/gateway`

The API Gateway is the single entry point for all client requests. It handles:

1. **Request Routing**: Routes requests to appropriate backend services
2. **Authentication**: Validates JWT tokens
3. **Authorization**: Checks permissions via middleware
4. **Rate Limiting**: Prevents abuse
5. **Security Headers**: Adds security headers to responses
6. **Logging**: Records all requests
7. **Metrics**: Exposes Prometheus metrics

#### Middleware Pipeline

```go
// Middleware applied in order
router.Use(middleware.RequestID)        // 1. Assign unique request ID
router.Use(middleware.SecurityHeaders)  // 2. Add security headers
router.Use(middleware.Logger)           // 3. Log request
router.Use(middleware.Metrics)          // 4. Record metrics
router.Use(middleware.Recover)          // 5. Panic recovery
router.Use(middleware.RateLimiter)      // 6. Rate limiting

// Protected routes additionally use:
router.Use(middleware.Authenticate)          // 7. JWT validation
router.Use(middleware.RequireWorkspaceAccess) // 8. Workspace auth
```

#### Routing Configuration

```go
func SetupRoutes(r chi.Router, services *ServiceConfig) {
    // Health endpoints (no auth)
    r.Get("/health", healthHandler)
    r.Get("/health/ready", readinessHandler)
    r.Get("/health/live", livenessHandler)

    // API v1 routes
    r.Route("/api/v1", func(r chi.Router) {
        // Auth routes (no auth required)
        r.Route("/auth", func(r chi.Router) {
            r.Post("/login", proxy(services.Auth))
            r.Post("/register", proxy(services.Auth))
            r.Post("/forgot-password", proxy(services.Auth))
            r.Post("/reset-password", proxy(services.Auth))

            // Auth routes (auth required)
            r.Group(func(r chi.Router) {
                r.Use(middleware.Authenticate)
                r.Post("/logout", proxy(services.Auth))
                r.Post("/refresh", proxy(services.Auth))
                r.Get("/me", proxy(services.Auth))
                r.Put("/profile", proxy(services.Auth))
                r.Put("/password", proxy(services.Auth))
            })
        })

        // Protected routes
        r.Group(func(r chi.Router) {
            r.Use(middleware.Authenticate)
            r.Use(middleware.RequireWorkspaceAccess(workspaceValidator))

            // Port calls
            r.Route("/port-calls", func(r chi.Router) {
                r.Get("/", proxy(services.Core))
                r.Post("/", proxy(services.Core))
                r.Get("/{id}", proxy(services.Core))
                r.Put("/{id}", proxy(services.Core))
                r.Delete("/{id}", proxy(services.Core))
                r.Post("/{id}/status", proxy(services.Core))
                r.Get("/{id}/timeline", proxy(services.Core))
                r.Get("/{id}/services", proxy(services.Core))
            })

            // Vessels
            r.Route("/vessels", func(r chi.Router) {
                r.Get("/", proxy(services.Vessel))
                r.Post("/", proxy(services.Vessel))
                r.Get("/{id}", proxy(services.Vessel))
                r.Put("/{id}", proxy(services.Vessel))
                r.Get("/{id}/position", proxy(services.Vessel))
                r.Get("/{id}/track", proxy(services.Vessel))
            })

            // ... more routes
        })
    })

    // WebSocket (special handling)
    r.Get("/ws", websocketProxy(services.Realtime))
}
```

### Core Service

**Location**: `services/core`

The Core Service manages the primary business entities:

- Port Calls
- Service Orders
- RFQs (Request for Quotation)
- Quotes
- Vendors

#### Port Call Management

**Status Workflow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PORT CALL STATUS WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                              │  DRAFT  │                                    │
│                              └────┬────┘                                    │
│                                   │                                         │
│                                   │ submit                                  │
│                                   ▼                                         │
│                              ┌─────────┐                                    │
│               ┌──────────────┤ PLANNED ├──────────────┐                     │
│               │              └────┬────┘              │                     │
│               │                   │                   │                     │
│               │ cancel            │ confirm           │ cancel              │
│               ▼                   ▼                   ▼                     │
│         ┌───────────┐      ┌───────────┐       ┌───────────┐                │
│         │ CANCELLED │      │ CONFIRMED │       │ CANCELLED │                │
│         └───────────┘      └─────┬─────┘       └───────────┘                │
│                                  │                                          │
│                                  │ arrive                                   │
│                                  ▼                                          │
│                            ┌───────────┐                                    │
│                            │  ARRIVED  │                                    │
│                            └─────┬─────┘                                    │
│                                  │                                          │
│                                  │ berth                                    │
│                                  ▼                                          │
│                            ┌───────────┐                                    │
│                            │ ALONGSIDE │                                    │
│                            └─────┬─────┘                                    │
│                                  │                                          │
│                                  │ depart                                   │
│                                  ▼                                          │
│                            ┌───────────┐                                    │
│                            │ DEPARTED  │                                    │
│                            └─────┬─────┘                                    │
│                                  │                                          │
│                                  │ complete                                 │
│                                  ▼                                          │
│                            ┌───────────┐                                    │
│                            │ COMPLETED │                                    │
│                            └───────────┘                                    │
│                                                                             │
│  Valid Transitions:                                                         │
│  - draft → planned                                                          │
│  - planned → confirmed, cancelled                                           │
│  - confirmed → arrived, cancelled                                           │
│  - arrived → alongside                                                      │
│  - alongside → departed                                                     │
│  - departed → completed                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Status Transition Validation:**

```go
var validTransitions = map[PortCallStatus][]PortCallStatus{
    StatusDraft:     {StatusPlanned},
    StatusPlanned:   {StatusConfirmed, StatusCancelled},
    StatusConfirmed: {StatusArrived, StatusCancelled},
    StatusArrived:   {StatusAlongside},
    StatusAlongside: {StatusDeparted},
    StatusDeparted:  {StatusCompleted},
    StatusCompleted: {}, // Terminal state
    StatusCancelled: {}, // Terminal state
}

func (s PortCallStatus) CanTransitionTo(target PortCallStatus) bool {
    allowed, exists := validTransitions[s]
    if !exists {
        return false
    }
    for _, status := range allowed {
        if status == target {
            return true
        }
    }
    return false
}
```

### Vessel Service

**Location**: `services/vessel`

Manages vessel registry and real-time position tracking.

#### AIS Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AIS INTEGRATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         AIS PROVIDER INTERFACE                      │    │
│  │                                                                     │    │
│  │  type AISProvider interface {                                       │    │
│  │      GetPosition(ctx, imo string) (*Position, error)                │    │
│  │      GetPositions(ctx, imos []string) ([]Position, error)           │    │
│  │      GetVesselInfo(ctx, imo string) (*VesselInfo, error)            │    │
│  │      SubscribePositions(ctx, imos []string) (<-chan Position, err)  │    │
│  │  }                                                                  │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
│           ┌─────────────────────┼─────────────────────┐                     │
│           │                     │                     │                     │
│           ▼                     ▼                     ▼                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │
│  │  MarineTraffic  │   │  VesselFinder   │   │    Mock (Dev)   │            │
│  │    Adapter      │   │    Adapter      │   │    Adapter      │            │
│  │                 │   │                 │   │                 │            │
│  │  - REST API     │   │  - REST API     │   │  - Random data  │            │
│  │  - Satellite    │   │  - Terrestrial  │   │  - Fixed routes │            │
│  │  - Historical   │   │  - Real-time    │   │                 │            │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘            │
│                                                                             │
│  Position Update Worker:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  for {                                                              │    │
│  │      // 1. Get tracked vessels from database                        │    │
│  │      vessels := repo.GetTrackedVessels(ctx)                         │    │
│  │                                                                     │    │
│  │      // 2. Batch fetch positions from AIS provider                  │    │
│  │      imos := extractIMOs(vessels)                                   │    │
│  │      positions := aisProvider.GetPositions(ctx, imos)               │    │
│  │                                                                     │    │
│  │      // 3. Store in database                                        │    │
│  │      for _, pos := range positions {                                │    │
│  │          positionRepo.Create(ctx, pos)                              │    │
│  │      }                                                              │    │
│  │                                                                     │    │
│  │      // 4. Update Redis cache                                       │    │
│  │      for _, pos := range positions {                                │    │
│  │          redis.Set(ctx, "position:"+pos.VesselID, pos, 10*Minute)   │    │
│  │      }                                                              │    │
│  │                                                                     │    │
│  │      // 5. Publish updates                                          │    │
│  │      for _, pos := range positions {                                │    │
│  │          redis.Publish(ctx, "vessel:position", pos)                 │    │
│  │      }                                                              │    │
│  │                                                                     │    │
│  │      time.Sleep(updateInterval)                                     │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Realtime Service

**Location**: `services/realtime`

Provides WebSocket connections for real-time updates.

#### Hub Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REALTIME HUB ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                              HUB                                    │    │
│  │                                                                     │    │
│  │  type Hub struct {                                                  │    │
│  │      clients    map[*Client]bool        // Connected clients        │    │
│  │      rooms      map[string]map[*Client]bool // Topic subscriptions  │    │
│  │      register   chan *Client            // Client registration      │    │
│  │      unregister chan *Client            // Client removal           │    │
│  │      broadcast  chan *Message           // Outgoing messages        │    │
│  │      subscribe  chan *Subscription      // Topic subscriptions      │    │
│  │  }                                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Client Connection:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  type Client struct {                                               │    │
│  │      hub        *Hub                                                │    │
│  │      conn       *websocket.Conn                                     │    │
│  │      send       chan []byte                                         │    │
│  │      userID     string                                              │    │
│  │      orgID      string                                              │    │
│  │      topics     map[string]bool                                     │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  │  // Read pump - reads from WebSocket                                │    │
│  │  func (c *Client) readPump() {                                      │    │
│  │      for {                                                          │    │
│  │          _, message, err := c.conn.ReadMessage()                    │    │
│  │          if err != nil {                                            │    │
│  │              c.hub.unregister <- c                                  │    │
│  │              return                                                 │    │
│  │          }                                                          │    │
│  │          c.handleMessage(message)                                   │    │
│  │      }                                                              │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  │  // Write pump - writes to WebSocket                                │    │
│  │  func (c *Client) writePump() {                                     │    │
│  │      for message := range c.send {                                  │    │
│  │          c.conn.WriteMessage(websocket.TextMessage, message)        │    │
│  │      }                                                              │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Topic Subscription:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Topics:                                                            │    │
│  │  - workspace:{id}:port_calls    → Port call updates                 │    │
│  │  - workspace:{id}:services      → Service order updates             │    │
│  │  - workspace:{id}:vessels       → Vessel updates                    │    │
│  │  - vessel:{id}:position         → Single vessel position            │    │
│  │  - organization:{id}:notifications → Org-wide notifications         │    │
│  │  - user:{id}:notifications      → User-specific notifications       │    │
│  │                                                                     │    │
│  │  Access Control:                                                    │    │
│  │  - Clients can only subscribe to topics in their organization       │    │
│  │  - Workspace topics require workspace membership                    │    │
│  │  - User topics require matching user ID                             │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Redis Integration:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  // Subscribe to Redis pub/sub for cross-instance messaging         │    │
│  │  func (h *Hub) subscribeRedis() {                                   │    │
│  │      pubsub := redis.Subscribe(ctx, "events:*")                     │    │
│  │      for msg := range pubsub.Channel() {                            │    │
│  │          h.broadcast <- &Message{                                   │    │
│  │              Topic: msg.Channel,                                    │    │
│  │              Data:  msg.Payload,                                    │    │
│  │          }                                                          │    │
│  │      }                                                              │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Shared Packages

### Package Overview

```
pkg/
├── auth/           # JWT token handling
├── database/       # PostgreSQL connection management
├── redis/          # Redis client wrapper
├── logger/         # Structured logging (zap)
├── response/       # HTTP response helpers
├── features/       # Feature flag system
├── audit/          # Audit logging
├── storage/        # S3-compatible storage
├── metrics/        # Prometheus metrics
├── errors/         # Error types and handling
├── validator/      # Input validation
└── pagination/     # Pagination utilities
```

### pkg/auth

JWT token generation, validation, and claims management.

```go
// Token generation
func GenerateTokenPair(user *User) (*TokenPair, error) {
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
        UserID:         user.ID,
        OrganizationID: user.OrganizationID,
        Roles:          user.Roles,
        Permissions:    user.Permissions,
        TokenType:      "access",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "navo-auth",
        },
    })

    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
        UserID:    user.ID,
        TokenType: "refresh",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "navo-auth",
        },
    })

    accessTokenString, _ := accessToken.SignedString([]byte(jwtSecret))
    refreshTokenString, _ := refreshToken.SignedString([]byte(jwtSecret))

    return &TokenPair{
        AccessToken:  accessTokenString,
        RefreshToken: refreshTokenString,
        ExpiresAt:    time.Now().Add(15 * time.Minute).Unix(),
    }, nil
}

// Token validation
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(jwtSecret), nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }

    return nil, ErrInvalidToken
}

// Permission checking
func HasPermission(claims *Claims, permission string) bool {
    for _, p := range claims.Permissions {
        if p == permission || p == "*" {
            return true
        }
    }
    return false
}
```

### pkg/database

PostgreSQL connection pooling and configuration.

```go
type Config struct {
    Host            string
    Port            int
    User            string
    Password        string
    Database        string
    SSLMode         string
    MaxConns        int32
    MinConns        int32
    MaxConnLifetime time.Duration
    MaxConnIdleTime time.Duration
}

func NewPool(cfg *Config) (*pgxpool.Pool, error) {
    // Validate SSL mode
    if cfg.SSLMode == "" {
        cfg.SSLMode = "require" // Default to secure
    }

    // Warn if insecure
    if cfg.SSLMode == "disable" && os.Getenv("GO_ENV") == "production" {
        logger.Warn("PostgreSQL SSL is disabled in production - this is insecure!")
    }

    connString := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s "+
            "pool_max_conns=%d pool_min_conns=%d pool_max_conn_lifetime=%s pool_max_conn_idle_time=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, cfg.SSLMode,
        cfg.MaxConns, cfg.MinConns, cfg.MaxConnLifetime, cfg.MaxConnIdleTime,
    )

    poolConfig, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, fmt.Errorf("failed to parse config: %w", err)
    }

    // Add connection hooks for tenant context
    poolConfig.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
        // Set application name for monitoring
        _, err := conn.Exec(ctx, "SET application_name = 'navo-service'")
        return err
    }

    pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to create pool: %w", err)
    }

    // Verify connection
    if err := pool.Ping(ctx); err != nil {
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    return pool, nil
}

// Set tenant context for RLS
func SetTenantContext(ctx context.Context, pool *pgxpool.Pool, orgID string) error {
    _, err := pool.Exec(ctx,
        "SELECT set_config('app.current_organization_id', $1, true)",
        orgID,
    )
    return err
}
```

### pkg/audit

Comprehensive audit logging system.

```go
// Audit event types
type Action string

const (
    ActionCreate       Action = "CREATE"
    ActionRead         Action = "READ"
    ActionUpdate       Action = "UPDATE"
    ActionDelete       Action = "DELETE"
    ActionLogin        Action = "LOGIN"
    ActionLogout       Action = "LOGOUT"
    ActionAccessDenied Action = "ACCESS_DENIED"
    ActionExport       Action = "EXPORT"
    ActionApprove      Action = "APPROVE"
    ActionReject       Action = "REJECT"
    ActionStatusChange Action = "STATUS_CHANGE"
)

// Audit event
type Event struct {
    ID             string          `json:"id"`
    Timestamp      time.Time       `json:"timestamp"`
    UserID         string          `json:"user_id"`
    OrganizationID string          `json:"organization_id"`
    WorkspaceID    string          `json:"workspace_id,omitempty"`
    Action         Action          `json:"action"`
    EntityType     string          `json:"entity_type"`
    EntityID       string          `json:"entity_id"`
    OldValue       json.RawMessage `json:"old_value,omitempty"`
    NewValue       json.RawMessage `json:"new_value,omitempty"`
    Metadata       map[string]any  `json:"metadata,omitempty"`
    IPAddress      string          `json:"ip_address,omitempty"`
    UserAgent      string          `json:"user_agent,omitempty"`
    RequestID      string          `json:"request_id,omitempty"`
    Status         string          `json:"status"`
    ErrorMessage   string          `json:"error_message,omitempty"`
}

// Builder for constructing audit events
type Builder struct {
    event Event
}

func NewBuilder() *Builder {
    return &Builder{
        event: Event{
            ID:        uuid.New().String(),
            Timestamp: time.Now().UTC(),
            Status:    "success",
            Metadata:  make(map[string]any),
        },
    }
}

func (b *Builder) WithUser(userID, orgID string) *Builder {
    b.event.UserID = userID
    b.event.OrganizationID = orgID
    return b
}

func (b *Builder) WithAction(action Action) *Builder {
    b.event.Action = action
    return b
}

func (b *Builder) WithEntity(entityType, entityID string) *Builder {
    b.event.EntityType = entityType
    b.event.EntityID = entityID
    return b
}

func (b *Builder) WithOldValue(value any) *Builder {
    if data, err := json.Marshal(value); err == nil {
        b.event.OldValue = data
    }
    return b
}

func (b *Builder) WithNewValue(value any) *Builder {
    if data, err := json.Marshal(value); err == nil {
        b.event.NewValue = data
    }
    return b
}

func (b *Builder) Build() Event {
    return b.event
}

// Usage example
auditLogger.LogAsync(ctx, audit.NewBuilder().
    WithUser(userID, orgID).
    WithAction(audit.ActionUpdate).
    WithEntity("port_call", portCallID).
    WithOldValue(oldPortCall).
    WithNewValue(newPortCall).
    WithMetadata("status_change", map[string]string{
        "from": string(oldStatus),
        "to":   string(newStatus),
    }).
    Build())
```

---

## Data Architecture

See [Data Model Documentation](./data-model.md) for complete schema details.

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐         ┌───────────────┐                                │
│  │ Organization  │────────▶│   Workspace   │                                │
│  │               │   1:N   │               │                                │
│  └───────┬───────┘         └───────┬───────┘                                │
│          │                         │                                        │
│          │ 1:N                     │ 1:N                                    │
│          ▼                         ▼                                        │
│  ┌───────────────┐         ┌───────────────┐                                │
│  │     User      │────────▶│   PortCall    │                                │
│  │               │   1:N   │               │                                │
│  └───────────────┘         └───────┬───────┘                                │
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          │                         │                         │              │
│          │ N:1                     │ 1:N                     │ 1:N          │
│          ▼                         ▼                         ▼              │
│  ┌───────────────┐         ┌───────────────┐         ┌───────────────┐      │
│  │    Vessel     │         │ ServiceOrder  │         │  PortCallTL   │      │
│  │               │         │               │         │  (Timeline)   │      │
│  └───────┬───────┘         └───────┬───────┘         └───────────────┘      │
│          │                         │                                        │
│          │ 1:N                     │ N:1                                    │
│          ▼                         ▼                                        │
│  ┌───────────────┐         ┌───────────────┐                                │
│  │VesselPosition │         │    Vendor     │                                │
│  │               │         │               │                                │
│  └───────────────┘         └───────────────┘                                │
│                                    │                                        │
│                                    │ 1:N                                    │
│                                    ▼                                        │
│                            ┌───────────────┐                                │
│                            │      RFQ      │                                │
│                            │               │                                │
│                            └───────┬───────┘                                │
│                                    │                                        │
│                                    │ 1:N                                    │
│                                    ▼                                        │
│                            ┌───────────────┐                                │
│                            │     Quote     │                                │
│                            │               │                                │
│                            └───────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Architecture

### External Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL INTEGRATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         AIS PROVIDERS                               │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │    │
│  │  │  MarineTraffic  │    │  VesselFinder   │    │    Spire        │  │    │
│  │  │                 │    │                 │    │                 │  │    │
│  │  │  - REST API     │    │  - REST API     │    │  - REST API     │  │    │
│  │  │  - Rate: 1k/day │    │  - Rate: 500/hr │    │  - Streaming    │  │    │
│  │  │  - Polling      │    │  - Polling      │    │  - Real-time    │  │    │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         EMAIL PROVIDERS                             │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │    │
│  │  │    SendGrid     │    │    Mailgun      │    │    Amazon SES   │  │    │
│  │  │                 │    │                 │    │                 │  │    │
│  │  │  - SMTP         │    │  - SMTP         │    │  - SMTP         │  │    │
│  │  │  - REST API     │    │  - REST API     │    │  - SDK          │  │    │
│  │  │  - Webhooks     │    │  - Webhooks     │    │  - Webhooks     │  │    │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         STORAGE PROVIDERS                           │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │    │
│  │  │    AWS S3       │    │    GCS          │    │    MinIO        │  │    │
│  │  │                 │    │                 │    │                 │  │    │
│  │  │  - Documents    │    │  - Documents    │    │  - Documents    │  │    │
│  │  │  - Exports      │    │  - Exports      │    │  - Dev/Test     │  │    │
│  │  │  - Backups      │    │  - Backups      │    │  - Self-hosted  │  │    │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         MAP PROVIDERS                               │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐    ┌─────────────────┐                         │    │
│  │  │     Mapbox      │    │  Google Maps    │                         │    │
│  │  │                 │    │                 │                         │    │
│  │  │  - Vector tiles │    │  - Raster tiles │                         │    │
│  │  │  - Geocoding    │    │  - Geocoding    │                         │    │
│  │  │  - Directions   │    │  - Places API   │                         │    │
│  │  └─────────────────┘    └─────────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scalability and Performance

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALING STRATEGY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Service Scaling:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Gateway:     3 → 10 replicas (based on request rate)               │    │
│  │  Auth:        2 → 5 replicas  (based on auth request rate)          │    │
│  │  Core:        3 → 15 replicas (based on CPU/memory)                 │    │
│  │  Vessel:      2 → 8 replicas  (based on tracked vessels)            │    │
│  │  Realtime:    3 → 10 replicas (based on WebSocket connections)      │    │
│  │  Notification: 2 → 5 replicas (based on queue depth)                │    │
│  │                                                                     │    │
│  │  HPA Configuration:                                                 │    │
│  │  - CPU target: 70%                                                  │    │
│  │  - Memory target: 80%                                               │    │
│  │  - Scale up: 30 seconds                                             │    │
│  │  - Scale down: 5 minutes                                            │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Database Scaling:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  PostgreSQL:                                                        │    │
│  │  ├── Primary: Writes                                                │    │
│  │  ├── Read Replica 1: Analytics queries                              │    │
│  │  ├── Read Replica 2: Report generation                              │    │
│  │  └── Read Replica 3: General reads                                  │    │
│  │                                                                     │    │
│  │  Connection Pooling:                                                │    │
│  │  ├── Max connections: 50 per service instance                       │    │
│  │  ├── Min connections: 10 per service instance                       │    │
│  │  └── PgBouncer for external pooling                                 │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Cache Scaling:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Redis Cluster:                                                     │    │
│  │  ├── 6 nodes (3 primary + 3 replica)                                │    │
│  │  ├── Data sharding by key prefix                                    │    │
│  │  └── Automatic failover                                             │    │
│  │                                                                     │    │
│  │  Cache Strategy:                                                    │    │
│  │  ├── Feature flags: 5 min TTL                                       │    │
│  │  ├── Vessel positions: 10 min TTL                                   │    │
│  │  ├── User sessions: 15 min TTL                                      │    │
│  │  └── Rate limit counters: 1 min TTL                                 │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p50) | < 100ms | 45ms |
| API Response Time (p99) | < 500ms | 280ms |
| WebSocket Latency | < 50ms | 25ms |
| Database Query Time (p99) | < 100ms | 65ms |
| Cache Hit Rate | > 95% | 97% |
| Error Rate | < 0.1% | 0.05% |
| Availability | 99.9% | 99.95% |

---

## Monitoring and Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         METRICS (Prometheus)                        │    │
│  │                                                                     │    │
│  │  Application Metrics:                                               │    │
│  │  ├── http_requests_total{method, path, status}                      │    │
│  │  ├── http_request_duration_seconds{method, path}                    │    │
│  │  ├── websocket_connections_active{service}                          │    │
│  │  ├── database_connections_active{service}                           │    │
│  │  └── cache_hits_total{cache, result}                                │    │
│  │                                                                     │    │
│  │  Business Metrics:                                                  │    │
│  │  ├── port_calls_created_total{workspace, status}                    │    │
│  │  ├── service_orders_total{workspace, status}                        │    │
│  │  ├── rfq_quotes_received_total{workspace}                           │    │
│  │  └── vessel_positions_updated_total{provider}                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         LOGGING (ELK/Loki)                          │    │
│  │                                                                     │    │
│  │  Log Format (JSON):                                                 │    │
│  │  {                                                                  │    │
│  │    "timestamp": "2024-01-15T10:30:00Z",                             │    │
│  │    "level": "info",                                                 │    │
│  │    "service": "core",                                               │    │
│  │    "request_id": "req_abc123",                                      │    │
│  │    "user_id": "usr_xyz789",                                         │    │
│  │    "org_id": "org_def456",                                          │    │
│  │    "message": "Port call created",                                  │    │
│  │    "port_call_id": "pc_123",                                        │    │
│  │    "duration_ms": 45                                                │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         TRACING (Jaeger)                            │    │
│  │                                                                     │    │
│  │  Trace Flow:                                                        │    │
│  │  Client → Gateway → Core Service → Database                         │    │
│  │     │        │          │              │                            │    │
│  │     ▼        ▼          ▼              ▼                            │    │
│  │  [span]  [span]      [span]         [span]                          │    │
│  │  100ms   10ms        40ms           20ms                            │    │
│  │                                                                     │    │
│  │  Span Tags:                                                         │    │
│  │  ├── http.method, http.url, http.status_code                        │    │
│  │  ├── db.type, db.statement                                          │    │
│  │  └── user.id, organization.id                                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | error_rate > 5% for 5m | Critical |
| HighLatency | p99_latency > 1s for 5m | Warning |
| ServiceDown | up == 0 for 1m | Critical |
| DatabaseConnExhausted | connections > 90% for 5m | Warning |
| CacheMissRateHigh | cache_miss_rate > 20% for 10m | Warning |
| DiskSpaceLow | disk_usage > 85% | Warning |
| MemoryPressure | memory_usage > 90% for 5m | Warning |

---

## Technology Decisions

### Why Next.js 14?

| Consideration | Decision Rationale |
|---------------|-------------------|
| **Server Components** | Reduced client bundle, improved initial load |
| **App Router** | Better layouts, parallel routes, intercepting routes |
| **Streaming** | Progressive rendering for better UX |
| **Edge Runtime** | Low-latency for global users |
| **Built-in Optimizations** | Image, font, script optimization |

### Why Go for Backend?

| Consideration | Decision Rationale |
|---------------|-------------------|
| **Performance** | Low latency, efficient memory usage |
| **Concurrency** | Goroutines for handling many connections |
| **Simplicity** | Easy to read, maintain, and onboard |
| **Deployment** | Single binary, no runtime dependencies |
| **Ecosystem** | Strong standard library, mature tooling |

### Why PostgreSQL?

| Consideration | Decision Rationale |
|---------------|-------------------|
| **ACID Compliance** | Critical for financial data integrity |
| **Row-Level Security** | Native multi-tenancy support |
| **JSON Support** | Flexible schema for metadata |
| **Extensions** | PostGIS for geo queries, pg_stat_statements |
| **Reliability** | Proven at scale, excellent tooling |

### Why Redis?

| Consideration | Decision Rationale |
|---------------|-------------------|
| **Performance** | Sub-millisecond operations |
| **Pub/Sub** | Real-time event broadcasting |
| **Data Structures** | Sorted sets for leaderboards, streams for queues |
| **Clustering** | Horizontal scalability |
| **Persistence** | AOF/RDB for durability |

---

## Future Considerations

### Planned Enhancements

1. **GraphQL API**: Flexible querying for complex frontend needs
2. **Event Sourcing**: Full audit trail with replay capability
3. **ML Integration**: Predictive analytics for port operations
4. **Mobile Apps**: Native iOS/Android applications
5. **Offline Support**: PWA capabilities for unreliable connections
6. **Multi-Region**: Global deployment with data residency compliance

### Technical Debt

| Item | Priority | Effort |
|------|----------|--------|
| Migrate to pgx v5 | Medium | 2 weeks |
| Add OpenTelemetry | High | 1 week |
| Implement circuit breakers | High | 1 week |
| Add integration tests | High | 3 weeks |
| Improve error handling | Medium | 1 week |

---

## Related Documentation

- [Services Documentation](./services.md)
- [Security Architecture](./security.md)
- [Data Model](./data-model.md)
- [API Reference](../api/README.md)
- [Deployment Guide](../deployment/production.md)
- [Developer Guide](../development/getting-started.md)
