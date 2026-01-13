# Navo Data Model

This document describes the database schema and entity relationships for the Navo platform.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Organization   │       │    Workspace    │       │      User       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │───┐   │ id              │───┐   │ id              │
│ name            │   │   │ organization_id │◄──┘   │ email           │
│ domain          │   │   │ name            │   │   │ name            │
│ settings        │   │   │ settings        │   │   │ organization_id │◄──┐
│ created_at      │   │   │ created_at      │   │   │ role            │   │
└─────────────────┘   │   └─────────────────┘   │   │ created_at      │   │
                      │                         │   └─────────────────┘   │
                      │                         │                         │
                      └─────────────────────────┴─────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Vessel      │       │      Port       │       │   PortCall      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │───┐   │ id              │───┐   │ id              │
│ name            │   │   │ name            │   │   │ reference       │
│ imo             │   │   │ unlocode        │   │   │ vessel_id       │◄──┘
│ mmsi            │   │   │ country         │   │   │ port_id         │◄──┘
│ flag            │   │   │ latitude        │   │   │ workspace_id    │
│ type            │   │   │ longitude       │   │   │ organization_id │
│ organization_id │   │   │ timezone        │   │   │ status          │
│ created_at      │   │   └─────────────────┘   │   │ eta/etd/ata/atd │
└─────────────────┘   │                         │   │ created_at      │
                      │                         │   └─────────────────┘
                      └─────────────────────────┘           │
                                                            │
┌─────────────────┐       ┌─────────────────┐               │
│  ServiceOrder   │       │      RFQ        │               │
├─────────────────┤       ├─────────────────┤               │
│ id              │◄──────│ service_order_id│               │
│ port_call_id    │◄──────┴─────────────────┤               │
│ service_type_id │       │ id              │◄──────────────┘
│ vendor_id       │       │ status          │
│ status          │       │ deadline        │
│ quantity        │       │ created_by      │
│ price           │       │ created_at      │
│ created_at      │       └─────────────────┘
└─────────────────┘               │
        │                         │
        │               ┌─────────▼─────────┐
        │               │      Quote        │
        │               ├───────────────────┤
        │               │ id                │
        │               │ rfq_id            │
        │               │ vendor_id         │
        │               │ price             │
        │               │ valid_until       │
        │               │ status            │
        │               └───────────────────┘
        │
┌───────▼─────────┐
│     Vendor      │
├─────────────────┤
│ id              │
│ name            │
│ organization_id │
│ service_types   │
│ contact_email   │
│ status          │
│ created_at      │
└─────────────────┘
```

---

## Core Entities

### Organization

Represents a tenant in the multi-tenant system.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_domain ON organizations(domain);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization name |
| domain | VARCHAR(255) | Email domain for SSO |
| settings | JSONB | Organization-wide settings |
| subscription_tier | VARCHAR(50) | Feature tier |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Workspace

Logical grouping of operations within an organization.

```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, name)
);

CREATE INDEX idx_workspaces_organization ON workspaces(organization_id);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Parent organization |
| name | VARCHAR(255) | Workspace name |
| description | TEXT | Optional description |
| settings | JSONB | Workspace-specific settings |
| is_default | BOOLEAN | Default workspace for org |

### User

Platform users with organization membership.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| name | VARCHAR(255) | Display name |
| organization_id | UUID | Parent organization |
| role | VARCHAR(50) | User role (admin, manager, operator, viewer) |
| avatar_url | VARCHAR(500) | Profile picture URL |
| failed_login_attempts | INTEGER | For brute force protection |
| locked_until | TIMESTAMP | Account lockout time |

### UserWorkspace

Many-to-many relationship between users and workspaces.

```sql
CREATE TABLE user_workspaces (
    user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (user_id, workspace_id)
);
```

---

## Maritime Entities

### Vessel

Ship registry with identification details.

```sql
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    imo VARCHAR(20) UNIQUE,
    mmsi VARCHAR(20),
    call_sign VARCHAR(20),
    flag VARCHAR(100),
    type VARCHAR(100),
    gross_tonnage INTEGER,
    deadweight INTEGER,
    length_overall DECIMAL(10,2),
    beam DECIMAL(10,2),
    draft DECIMAL(10,2),
    year_built INTEGER,
    owner VARCHAR(255),
    manager VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vessels_organization ON vessels(organization_id);
CREATE INDEX idx_vessels_imo ON vessels(imo);
CREATE INDEX idx_vessels_mmsi ON vessels(mmsi);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Owning organization |
| name | VARCHAR(255) | Vessel name |
| imo | VARCHAR(20) | IMO number (unique identifier) |
| mmsi | VARCHAR(20) | Maritime Mobile Service Identity |
| call_sign | VARCHAR(20) | Radio call sign |
| flag | VARCHAR(100) | Flag state |
| type | VARCHAR(100) | Vessel type (container, tanker, etc.) |
| gross_tonnage | INTEGER | Gross tonnage |
| deadweight | INTEGER | Deadweight tonnage |

### VesselPosition

Real-time and historical vessel positions.

```sql
CREATE TABLE vessel_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    course DECIMAL(5,2),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    status VARCHAR(50),
    destination VARCHAR(255),
    eta TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'ais',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by month for scalability
CREATE INDEX idx_positions_vessel_time ON vessel_positions(vessel_id, received_at DESC);
CREATE INDEX idx_positions_time ON vessel_positions(received_at DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| latitude | DECIMAL(10,7) | Position latitude |
| longitude | DECIMAL(10,7) | Position longitude |
| course | DECIMAL(5,2) | Course over ground |
| speed | DECIMAL(5,2) | Speed over ground (knots) |
| heading | DECIMAL(5,2) | True heading |
| status | VARCHAR(50) | Navigation status |
| source | VARCHAR(50) | Data source (ais, manual) |

### Port

Port/terminal registry.

```sql
CREATE TABLE ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    unlocode VARCHAR(10) UNIQUE,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    timezone VARCHAR(100),
    port_type VARCHAR(50),
    facilities JSONB DEFAULT '[]',
    contacts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ports_unlocode ON ports(unlocode);
CREATE INDEX idx_ports_country ON ports(country_code);
```

| Column | Type | Description |
|--------|------|-------------|
| unlocode | VARCHAR(10) | UN/LOCODE (e.g., USLAX) |
| timezone | VARCHAR(100) | IANA timezone |
| facilities | JSONB | Available facilities array |
| contacts | JSONB | Port authority contacts |

---

## Operations Entities

### PortCall

A vessel's visit to a port.

```sql
CREATE TABLE port_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(100) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    port_id UUID NOT NULL REFERENCES ports(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    -- Timestamps
    eta TIMESTAMP WITH TIME ZONE,
    etd TIMESTAMP WITH TIME ZONE,
    ata TIMESTAMP WITH TIME ZONE,
    atd TIMESTAMP WITH TIME ZONE,

    -- Berth info
    berth_name VARCHAR(100),
    berth_terminal VARCHAR(100),
    berth_confirmed BOOLEAN DEFAULT FALSE,

    -- Assignments
    agent_id UUID REFERENCES vendors(id),

    -- Cargo
    cargo_type VARCHAR(100),
    cargo_quantity DECIMAL(15,2),
    cargo_unit VARCHAR(50),

    -- Metadata
    purpose VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, reference)
);

CREATE INDEX idx_port_calls_workspace ON port_calls(workspace_id);
CREATE INDEX idx_port_calls_vessel ON port_calls(vessel_id);
CREATE INDEX idx_port_calls_port ON port_calls(port_id);
CREATE INDEX idx_port_calls_status ON port_calls(status);
CREATE INDEX idx_port_calls_eta ON port_calls(eta);

-- Enable RLS
ALTER TABLE port_calls ENABLE ROW LEVEL SECURITY;
```

| Column | Type | Description |
|--------|------|-------------|
| reference | VARCHAR(100) | Unique reference within org |
| status | VARCHAR(50) | Workflow status |
| eta | TIMESTAMP | Estimated time of arrival |
| etd | TIMESTAMP | Estimated time of departure |
| ata | TIMESTAMP | Actual time of arrival |
| atd | TIMESTAMP | Actual time of departure |
| berth_name | VARCHAR(100) | Assigned berth |
| berth_confirmed | BOOLEAN | Berth booking confirmed |
| agent_id | UUID | Assigned port agent |

#### Port Call Status Values

| Status | Description |
|--------|-------------|
| draft | Initial creation, incomplete |
| planned | All details entered |
| confirmed | Berth and agent confirmed |
| arrived | Vessel has arrived |
| alongside | Vessel at berth |
| departed | Vessel has left berth |
| completed | Call finalized |
| cancelled | Call cancelled |

### PortCallTimeline

Event history for a port call.

```sql
CREATE TABLE port_call_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_call_id UUID NOT NULL REFERENCES port_calls(id),
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_timeline_port_call ON port_call_timeline(port_call_id, timestamp);
```

### ServiceType

Catalog of available services.

```sql
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    requires_quantity BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

| Category | Examples |
|----------|----------|
| cargo | Loading, unloading, stevedoring |
| vessel | Bunkering, fresh water, provisions |
| technical | Repairs, surveys, inspections |
| administrative | Customs, immigration, port dues |

### ServiceOrder

Service requests for a port call.

```sql
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    port_call_id UUID NOT NULL REFERENCES port_calls(id),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    vendor_id UUID REFERENCES vendors(id),

    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    description TEXT,
    quantity DECIMAL(15,2),
    unit VARCHAR(50),

    -- Pricing
    quoted_price DECIMAL(15,2),
    final_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Scheduling
    requested_date TIMESTAMP WITH TIME ZONE,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_orders_port_call ON service_orders(port_call_id);
CREATE INDEX idx_service_orders_vendor ON service_orders(vendor_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
```

#### Service Order Status Values

| Status | Description |
|--------|-------------|
| draft | Initial creation |
| requested | Submitted for processing |
| rfq_sent | RFQ sent to vendors |
| quoted | Quote received |
| confirmed | Service confirmed with vendor |
| in_progress | Service being performed |
| completed | Service completed |
| cancelled | Order cancelled |

---

## RFQ Entities

### RFQ

Request for quotation to vendors.

```sql
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    service_order_id UUID REFERENCES service_orders(id),
    port_call_id UUID REFERENCES port_calls(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,

    requirements JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',

    awarded_vendor_id UUID REFERENCES vendors(id),
    awarded_quote_id UUID,
    awarded_at TIMESTAMP WITH TIME ZONE,

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rfqs_workspace ON rfqs(workspace_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_deadline ON rfqs(deadline);

ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
```

#### RFQ Status Values

| Status | Description |
|--------|-------------|
| draft | Being prepared |
| open | Accepting quotes |
| closed | Deadline passed |
| evaluating | Reviewing quotes |
| awarded | Vendor selected |
| cancelled | RFQ cancelled |

### RFQInvitation

Vendors invited to an RFQ.

```sql
CREATE TABLE rfq_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    viewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',

    UNIQUE(rfq_id, vendor_id)
);
```

### Quote

Vendor quote in response to RFQ.

```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),

    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

    line_items JSONB DEFAULT '[]',
    terms TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',

    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX idx_quotes_rfq ON quotes(rfq_id);
CREATE INDEX idx_quotes_vendor ON quotes(vendor_id);
```

---

## Vendor Entities

### Vendor

Service providers and agents.

```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),

    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),

    -- Contact
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),

    -- Services
    service_types JSONB DEFAULT '[]',
    service_ports JSONB DEFAULT '[]',

    -- Rating
    rating DECIMAL(3,2),
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendors_organization ON vendors(organization_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_type ON vendors(type);
```

| Vendor Type | Description |
|-------------|-------------|
| agent | Port agent |
| stevedore | Cargo handling |
| bunker | Fuel supplier |
| provisions | Ship supplies |
| repairs | Technical services |
| surveyor | Inspection services |

---

## System Entities

### FeatureFlag

Feature flag configuration.

```sql
CREATE TABLE feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_value BOOLEAN DEFAULT FALSE,
    enabled_organizations UUID[] DEFAULT '{}',
    disabled_organizations UUID[] DEFAULT '{}',
    enabled_workspaces UUID[] DEFAULT '{}',
    disabled_workspaces UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### AuditLog

Immutable audit trail.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR(100) NOT NULL,
    organization_id VARCHAR(100) NOT NULL,
    workspace_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Partition by month
CREATE INDEX idx_audit_organization_time
    ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_entity
    ON audit_logs(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_user
    ON audit_logs(user_id, timestamp DESC);
```

### Document

File attachments and documents.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    workspace_id UUID REFERENCES workspaces(id),

    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(100),

    -- Association
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Access
    is_public BOOLEAN DEFAULT FALSE,
    shared_with JSONB DEFAULT '[]',

    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
```

---

## Indexes and Performance

### Critical Indexes

```sql
-- High-frequency queries
CREATE INDEX idx_port_calls_workspace_status
    ON port_calls(workspace_id, status, eta);

CREATE INDEX idx_service_orders_port_call_status
    ON service_orders(port_call_id, status);

CREATE INDEX idx_vessel_positions_latest
    ON vessel_positions(vessel_id, received_at DESC);

-- Full-text search
CREATE INDEX idx_vessels_search
    ON vessels USING gin(to_tsvector('english', name || ' ' || imo));

CREATE INDEX idx_ports_search
    ON ports USING gin(to_tsvector('english', name || ' ' || unlocode));
```

### Partitioning Strategy

High-volume tables are partitioned for scalability:

```sql
-- Position data partitioned by month
CREATE TABLE vessel_positions (
    ...
) PARTITION BY RANGE (received_at);

CREATE TABLE vessel_positions_2024_01
    PARTITION OF vessel_positions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Audit logs partitioned by month
CREATE TABLE audit_logs (
    ...
) PARTITION BY RANGE (timestamp);
```

---

## Data Migrations

Migrations are managed with Prisma and raw SQL in `packages/db/`:

```
packages/db/
├── prisma/
│   └── schema.prisma
├── migrations/
│   ├── 001_add_rls_policies.sql
│   └── ...
└── scripts/
    ├── deploy.sh
    └── seed-data.ts
```

### Migration Commands

```bash
# Generate migration
pnpm --filter @navo/db db:migrate:dev

# Deploy migrations
pnpm --filter @navo/db db:push

# Seed data
pnpm --filter @navo/db db:seed
```
