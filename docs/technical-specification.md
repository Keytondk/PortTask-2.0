# PortTask: Execution Description

## Technical Implementation Guide

---

## Overview

This document provides the technical execution plan for building PortTask, covering architecture, data models, API design, and implementation specifications for all three portals.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                   │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│                 │                 │                                 │
│  key.porttask   │ portal.porttask │  vendor.porttask               │
│  (Main Platform)│ (Ops Portal)    │  (Vendor Portal)               │
│                 │                 │                                 │
└────────┬────────┴────────┬────────┴─────────────┬───────────────────┘
         │                 │                      │
         └─────────────────┼──────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   API       │
                    │   Gateway   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐      ┌─────┴─────┐     ┌─────┴─────┐
    │ Auth    │      │ Core API  │     │ Real-time │
    │ Service │      │ Services  │     │ Service   │
    └────┬────┘      └─────┬─────┘     └─────┬─────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database   │
                    │  Layer      │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐      ┌─────┴─────┐     ┌─────┴─────┐
    │PostgreSQL│     │  Redis    │     │   S3      │
    │ (Primary)│     │ (Cache)   │     │ (Files)   │
    └──────────┘     └───────────┘     └───────────┘
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API SERVICES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Auth        │  │ Workspace   │  │ Vessel      │  │ Port Call  │ │
│  │ Service     │  │ Service     │  │ Service     │  │ Service    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ RFQ         │  │ Vendor      │  │ Service     │  │ Document   │ │
│  │ Service     │  │ Service     │  │ Order Svc   │  │ Service    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Notification│  │ Analytics   │  │ Integration │  │ Automation │ │
│  │ Service     │  │ Service     │  │ Service     │  │ Service    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Core Entities

#### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  type: 'operator' | 'customer' | 'vendor' | 'agent';
  status: 'active' | 'inactive' | 'pending';
  settings: OrganizationSettings;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: UserRole[];
  permissions: Permission[];
  status: 'active' | 'inactive' | 'invited';
  lastLoginAt: DateTime;
  createdAt: DateTime;
}

interface UserRole {
  role: 'admin' | 'operator' | 'customer' | 'crew' | 'crew-ops' | 'agent' | 'vendor';
  scope: {
    workspaceIds?: string[];
    vesselIds?: string[];
    portIds?: string[];
  };
  approvalLimit?: number;
}
```

#### Workspace
```typescript
interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  type: 'customer' | 'project' | 'internal';
  status: 'active' | 'inactive';
  settings: WorkspaceSettings;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Vessel
```typescript
interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  type: VesselType;
  details: {
    dwt: number;
    loa: number;
    beam: number;
    draft: number;
    built: number;
    class: string;
  };
  workspaceId: string;
  status: 'active' | 'inactive';
  currentPosition?: VesselPosition;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface VesselPosition {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination?: string;
  eta?: DateTime;
  updatedAt: DateTime;
}
```

#### Port
```typescript
interface Port {
  id: string;
  name: string;
  unlocode: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  facilities: string[];
  status: 'active' | 'inactive';
}
```

#### PortCall
```typescript
interface PortCall {
  id: string;
  reference: string;
  vesselId: string;
  portId: string;
  workspaceId: string;
  status: PortCallStatus;

  schedule: {
    eta: DateTime;
    etd: DateTime;
    ata?: DateTime;
    atd?: DateTime;
  };

  berth?: {
    name: string;
    terminal: string;
    confirmedAt?: DateTime;
  };

  agentId?: string;

  services: ServiceOrder[];
  documents: Document[];

  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

type PortCallStatus =
  | 'draft'
  | 'planned'
  | 'confirmed'
  | 'arrived'
  | 'alongside'
  | 'departed'
  | 'completed'
  | 'cancelled';
```

#### ServiceOrder
```typescript
interface ServiceOrder {
  id: string;
  portCallId: string;
  serviceTypeId: string;

  status: ServiceOrderStatus;

  details: {
    description: string;
    quantity?: number;
    unit?: string;
    specifications?: Record<string, any>;
  };

  schedule: {
    requestedDate: DateTime;
    confirmedDate?: DateTime;
    completedDate?: DateTime;
  };

  vendor?: {
    id: string;
    name: string;
    contact: string;
  };

  pricing: {
    quoted?: number;
    final?: number;
    currency: string;
  };

  rfqId?: string;

  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

type ServiceOrderStatus =
  | 'draft'
  | 'requested'
  | 'rfq_sent'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
```

#### RFQ (Request for Quote)
```typescript
interface RFQ {
  id: string;
  reference: string;
  serviceOrderId: string;
  portCallId: string;

  status: RFQStatus;

  details: {
    serviceTypeId: string;
    description: string;
    quantity?: number;
    unit?: string;
    specifications?: Record<string, any>;
    deliveryDate: DateTime;
  };

  deadline: DateTime;

  invitedVendors: string[];
  quotes: Quote[];

  awardedQuoteId?: string;
  awardedAt?: DateTime;

  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

type RFQStatus =
  | 'draft'
  | 'sent'
  | 'evaluating'
  | 'awarded'
  | 'expired'
  | 'cancelled';

interface Quote {
  id: string;
  rfqId: string;
  vendorId: string;

  status: 'submitted' | 'awarded' | 'rejected' | 'withdrawn';

  pricing: {
    unitPrice: number;
    totalPrice: number;
    currency: string;
  };

  terms: {
    paymentTerms: string;
    deliveryDate: DateTime;
    validUntil: DateTime;
  };

  notes?: string;
  attachments?: string[];

  submittedAt: DateTime;
}
```

#### Vendor
```typescript
interface Vendor {
  id: string;
  name: string;
  organizationId: string;

  profile: {
    registrationNumber: string;
    address: Address;
    contacts: Contact[];
    bankDetails?: BankDetails;
  };

  capabilities: {
    serviceTypes: string[];
    ports: string[];
    certifications: Certification[];
  };

  performance: {
    rating: number;
    totalOrders: number;
    onTimeDelivery: number;
    responseTime: number; // hours
  };

  status: 'pending' | 'verified' | 'active' | 'suspended' | 'inactive';
  verifiedAt?: DateTime;

  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Agent
```typescript
interface Agent {
  id: string;
  name: string;
  organizationId: string;

  profile: {
    address: Address;
    contacts: Contact[];
  };

  coverage: {
    ports: string[];
    services: string[];
  };

  performance: {
    rating: number;
    totalCalls: number;
    responseTime: number;
  };

  status: 'active' | 'inactive';

  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Document
```typescript
interface Document {
  id: string;
  name: string;
  type: DocumentType;

  entityType: 'port_call' | 'service_order' | 'vessel' | 'vendor';
  entityId: string;

  file: {
    url: string;
    size: number;
    mimeType: string;
  };

  uploadedBy: string;
  uploadedAt: DateTime;
}

type DocumentType =
  | 'pda'          // Proforma Disbursement Account
  | 'fda'          // Final Disbursement Account
  | 'sof'          // Statement of Facts
  | 'bdn'          // Bunker Delivery Note
  | 'invoice'
  | 'receipt'
  | 'certificate'
  | 'other';
```

#### Incident
```typescript
interface Incident {
  id: string;
  title: string;
  description: string;

  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';

  relatedTo?: {
    portCallId?: string;
    vesselId?: string;
    serviceOrderId?: string;
  };

  assignedTo?: string;

  timeline: IncidentEvent[];

  resolvedAt?: DateTime;
  resolution?: string;

  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Notification
```typescript
interface Notification {
  id: string;
  userId: string;

  type: NotificationType;
  title: string;
  message: string;

  data?: Record<string, any>;
  link?: string;

  channels: ('in_app' | 'email' | 'push')[];

  readAt?: DateTime;
  sentAt: DateTime;
  createdAt: DateTime;
}
```

#### AutomationRule
```typescript
interface AutomationRule {
  id: string;
  name: string;
  description?: string;

  trigger: {
    event: string;
    conditions: Condition[];
  };

  actions: Action[];

  status: 'active' | 'paused' | 'draft';

  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## API Design

### Authentication

```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

### Workspaces

```
GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PUT    /workspaces/:id
DELETE /workspaces/:id
GET    /workspaces/:id/vessels
GET    /workspaces/:id/port-calls
GET    /workspaces/:id/users
```

### Vessels

```
GET    /vessels
POST   /vessels
GET    /vessels/:id
PUT    /vessels/:id
DELETE /vessels/:id
GET    /vessels/:id/position
GET    /vessels/:id/port-calls
GET    /vessels/:id/track
```

### Port Calls

```
GET    /port-calls
POST   /port-calls
GET    /port-calls/:id
PUT    /port-calls/:id
DELETE /port-calls/:id

# Sub-resources
GET    /port-calls/:id/services
POST   /port-calls/:id/services
GET    /port-calls/:id/documents
POST   /port-calls/:id/documents
GET    /port-calls/:id/timeline
GET    /port-calls/:id/messages
POST   /port-calls/:id/messages
```

### Service Orders

```
GET    /service-orders
POST   /service-orders
GET    /service-orders/:id
PUT    /service-orders/:id
DELETE /service-orders/:id
POST   /service-orders/:id/confirm
POST   /service-orders/:id/complete
POST   /service-orders/:id/cancel
```

### RFQs

```
GET    /rfqs
POST   /rfqs
GET    /rfqs/:id
PUT    /rfqs/:id
DELETE /rfqs/:id
POST   /rfqs/:id/send
POST   /rfqs/:id/close
GET    /rfqs/:id/quotes
POST   /rfqs/:id/quotes           # Vendor submits quote
POST   /rfqs/:id/award/:quoteId
```

### Vendors

```
GET    /vendors
POST   /vendors
GET    /vendors/:id
PUT    /vendors/:id
DELETE /vendors/:id
GET    /vendors/:id/orders
GET    /vendors/:id/rfqs
GET    /vendors/:id/performance
POST   /vendors/:id/verify
```

### Agents

```
GET    /agents
POST   /agents
GET    /agents/:id
PUT    /agents/:id
DELETE /agents/:id
GET    /agents/:id/port-calls
GET    /agents/:id/performance
```

### Analytics

```
GET    /analytics/overview
GET    /analytics/sla
GET    /analytics/vendor-performance
GET    /analytics/vessel-performance
GET    /analytics/cost-analysis
GET    /analytics/time-series
POST   /analytics/reports
GET    /analytics/reports/:id
```

### Real-time

```
WebSocket /ws/live
  - Subscribe to events
  - Port call updates
  - Vessel positions
  - Messages
  - Notifications
```

---

## Portal Access Control

### Permission Matrix

```typescript
const permissions = {
  // Main Platform (key.porttask.com)
  'platform:admin': ['*'],
  'platform:operator': [
    'workspace:read', 'workspace:write',
    'vessel:read', 'vessel:write',
    'port-call:read', 'port-call:write',
    'rfq:read', 'rfq:write',
    'vendor:read', 'vendor:write',
    'analytics:read',
    'settings:read', 'settings:write',
  ],

  // Operations Portal (portal.porttask.com)
  'portal:customer': [
    'workspace:read:own',
    'vessel:read:own',
    'port-call:read:own',
    'analytics:read:own',
    'approval:read:own', 'approval:write:own',
  ],
  'portal:crew': [
    'vessel:read:assigned',
    'port-call:read:assigned',
    'request:read:own', 'request:write:own',
  ],
  'portal:crew-ops': [
    'vessel:read:assigned',
    'port-call:read:assigned', 'port-call:write:assigned',
    'request:read:own', 'request:write:own',
    'approval:read:limited', 'approval:write:limited',
  ],
  'portal:agent': [
    'port-call:read:assigned', 'port-call:update:assigned',
    'task:read:assigned', 'task:write:assigned',
    'document:read:assigned', 'document:write:assigned',
  ],

  // Vendor Portal (vendor.porttask.com)
  'vendor:user': [
    'rfq:read:invited',
    'quote:read:own', 'quote:write:own',
    'order:read:own', 'order:update:own',
    'performance:read:own',
    'profile:read:own', 'profile:write:own',
  ],
};
```

### Data Scoping

```typescript
// Middleware for scoping data access
const scopeData = (user: User, query: Query) => {
  switch (user.portalType) {
    case 'platform':
      // Full access based on organization
      return query.where('organizationId', user.organizationId);

    case 'customer':
      // Only their workspaces
      return query.where('workspaceId', 'in', user.roles.workspaceIds);

    case 'crew':
    case 'crew-ops':
      // Only their assigned vessels
      return query.where('vesselId', 'in', user.roles.vesselIds);

    case 'agent':
      // Only assigned port calls
      return query.where('agentId', user.agentId);

    case 'vendor':
      // Only their RFQs and orders
      return query.where('vendorId', user.vendorId);
  }
};
```

---

## Real-Time Features

### WebSocket Events

```typescript
// Event types
type WebSocketEvent =
  | { type: 'port_call:updated'; data: PortCall }
  | { type: 'port_call:status_changed'; data: { id: string; status: string } }
  | { type: 'vessel:position_updated'; data: VesselPosition }
  | { type: 'rfq:quote_received'; data: Quote }
  | { type: 'service:status_changed'; data: ServiceOrder }
  | { type: 'message:received'; data: Message }
  | { type: 'notification:new'; data: Notification }
  | { type: 'incident:created'; data: Incident };

// Subscription channels
const channels = {
  workspace: (id: string) => `workspace:${id}`,
  vessel: (id: string) => `vessel:${id}`,
  portCall: (id: string) => `port-call:${id}`,
  user: (id: string) => `user:${id}`,
};
```

### Event Broadcasting

```typescript
// Broadcasting service
class EventBroadcaster {
  async broadcast(event: WebSocketEvent, channels: string[]) {
    // Send to all subscribers
    for (const channel of channels) {
      await this.redis.publish(channel, JSON.stringify(event));
    }

    // Store for offline users
    await this.storeForOfflineUsers(event, channels);
  }

  async broadcastPortCallUpdate(portCall: PortCall) {
    const channels = [
      `workspace:${portCall.workspaceId}`,
      `vessel:${portCall.vesselId}`,
      `port-call:${portCall.id}`,
    ];

    if (portCall.agentId) {
      channels.push(`agent:${portCall.agentId}`);
    }

    await this.broadcast(
      { type: 'port_call:updated', data: portCall },
      channels
    );
  }
}
```

---

## Integration Layer

### AIS Integration

```typescript
interface AISProvider {
  getVesselPosition(mmsi: string): Promise<VesselPosition>;
  subscribeToUpdates(mmsis: string[], callback: (position: VesselPosition) => void): void;
  getVesselTrack(mmsi: string, from: DateTime, to: DateTime): Promise<VesselPosition[]>;
}

// Implementation for MarineTraffic
class MarineTrafficProvider implements AISProvider {
  async getVesselPosition(mmsi: string): Promise<VesselPosition> {
    const response = await this.client.get(`/vessels/${mmsi}/position`);
    return this.mapToVesselPosition(response.data);
  }
}
```

### Weather Integration

```typescript
interface WeatherProvider {
  getForecast(lat: number, lon: number): Promise<WeatherForecast>;
  getAlerts(region: string): Promise<WeatherAlert[]>;
}

interface WeatherForecast {
  current: WeatherCondition;
  hourly: WeatherCondition[];
  daily: WeatherCondition[];
}

interface WeatherCondition {
  timestamp: DateTime;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  waveHeight?: number;
  visibility: number;
  conditions: string;
}
```

### Accounting Integration

```typescript
interface AccountingProvider {
  createInvoice(data: InvoiceData): Promise<string>;
  getInvoiceStatus(id: string): Promise<InvoiceStatus>;
  syncContacts(contacts: Contact[]): Promise<void>;
}

// Implementation for Xero
class XeroProvider implements AccountingProvider {
  async createInvoice(data: InvoiceData): Promise<string> {
    const invoice = await this.xero.invoices.create({
      contact: { contactID: data.contactId },
      lineItems: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitPrice,
      })),
      dueDate: data.dueDate,
    });
    return invoice.invoiceID;
  }
}
```

---

## Automation Engine

### Rule Processing

```typescript
interface AutomationEngine {
  registerTrigger(event: string, rule: AutomationRule): void;
  processEvent(event: SystemEvent): Promise<void>;
}

class AutomationProcessor implements AutomationEngine {
  async processEvent(event: SystemEvent) {
    const rules = await this.getRulesForEvent(event.type);

    for (const rule of rules) {
      if (this.evaluateConditions(rule.trigger.conditions, event)) {
        await this.executeActions(rule.actions, event);
      }
    }
  }

  private evaluateConditions(conditions: Condition[], event: SystemEvent): boolean {
    return conditions.every(condition => {
      const value = this.getValue(event, condition.field);
      return this.compare(value, condition.operator, condition.value);
    });
  }

  private async executeActions(actions: Action[], event: SystemEvent) {
    for (const action of actions) {
      switch (action.type) {
        case 'assign_agent':
          await this.assignAgent(event.data.portCallId, action.params.agentId);
          break;
        case 'send_notification':
          await this.sendNotification(action.params);
          break;
        case 'create_rfq':
          await this.createRFQ(event.data, action.params);
          break;
        case 'escalate':
          await this.escalate(event.data, action.params);
          break;
      }
    }
  }
}
```

### Example Rules

```typescript
const exampleRules: AutomationRule[] = [
  {
    id: 'auto-assign-rotterdam',
    name: 'Auto-assign Rotterdam agent',
    trigger: {
      event: 'port_call:created',
      conditions: [
        { field: 'port.unlocode', operator: 'equals', value: 'NLRTM' },
      ],
    },
    actions: [
      { type: 'assign_agent', params: { agentId: 'rotterdam-port-agency' } },
      { type: 'send_notification', params: {
        to: 'agent',
        template: 'new_port_call_assigned'
      }},
    ],
  },
  {
    id: 'rfq-no-response-escalation',
    name: 'Escalate if no RFQ response',
    trigger: {
      event: 'rfq:deadline_approaching',
      conditions: [
        { field: 'quotes.length', operator: 'equals', value: 0 },
        { field: 'hoursRemaining', operator: 'lessThan', value: 2 },
      ],
    },
    actions: [
      { type: 'send_notification', params: {
        to: 'operators',
        template: 'rfq_no_quotes_alert',
        priority: 'high'
      }},
    ],
  },
];
```

---

## Frontend Architecture

### Tech Stack

```
Framework:      Next.js 14 (App Router)
Language:       TypeScript
Styling:        Tailwind CSS
Components:     shadcn/ui
State:          Zustand + React Query
Forms:          React Hook Form + Zod
Maps:           Mapbox GL JS
Charts:         Recharts
Real-time:      Socket.io client
```

### Project Structure

```
src/
├── app/
│   ├── (platform)/           # Main platform routes
│   │   ├── ops/
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── command/
│   │   │   ├── plan/
│   │   │   ├── execute/
│   │   │   ├── vendors/
│   │   │   ├── analyze/
│   │   │   └── configure/
│   │   └── layout.tsx
│   │
│   ├── (portal)/             # Operations portal routes
│   │   ├── portal/
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── fleet/
│   │   │   ├── voyages/
│   │   │   ├── port-calls/
│   │   │   └── approvals/
│   │   └── layout.tsx
│   │
│   ├── (vendor)/             # Vendor portal routes
│   │   ├── vendor/
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── rfqs/
│   │   │   ├── orders/
│   │   │   └── performance/
│   │   └── layout.tsx
│   │
│   └── layout.tsx
│
├── components/
│   ├── ui/                   # Base UI components
│   ├── forms/                # Form components
│   ├── tables/               # Table components
│   ├── maps/                 # Map components
│   ├── charts/               # Chart components
│   └── domain/               # Domain-specific components
│       ├── port-call/
│       ├── vessel/
│       ├── rfq/
│       └── vendor/
│
├── hooks/
│   ├── usePortCalls.ts
│   ├── useVessels.ts
│   ├── useRFQs.ts
│   └── useRealtime.ts
│
├── lib/
│   ├── api.ts                # API client
│   ├── auth.ts               # Auth utilities
│   ├── socket.ts             # WebSocket client
│   └── utils.ts              # Utilities
│
├── stores/
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── realtimeStore.ts
│
└── types/
    └── index.ts              # TypeScript types
```

### Component Architecture

```typescript
// Domain component example: PortCallCard
interface PortCallCardProps {
  portCall: PortCall;
  variant?: 'compact' | 'full';
  onStatusChange?: (status: PortCallStatus) => void;
}

const PortCallCard: React.FC<PortCallCardProps> = ({
  portCall,
  variant = 'compact',
  onStatusChange,
}) => {
  return (
    <Card className={cn(
      'port-call-card',
      variant === 'compact' && 'p-4',
      variant === 'full' && 'p-6'
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <StatusBadge status={portCall.status} />
          <span className="text-sm text-muted-foreground">
            {portCall.reference}
          </span>
        </div>
        <CardTitle>{portCall.vessel.name}</CardTitle>
        <CardDescription>{portCall.port.name}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="ETA" value={formatDate(portCall.schedule.eta)} />
          <InfoItem label="ETD" value={formatDate(portCall.schedule.etd)} />
          <InfoItem label="Berth" value={portCall.berth?.name || 'TBD'} />
          <InfoItem label="Agent" value={portCall.agent?.name || 'Unassigned'} />
        </div>
      </CardContent>

      {variant === 'full' && (
        <CardFooter>
          <Button variant="outline" size="sm">View Details</Button>
          {onStatusChange && (
            <StatusDropdown
              current={portCall.status}
              onChange={onStatusChange}
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
};
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  roles JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessels
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  imo VARCHAR(20) UNIQUE,
  mmsi VARCHAR(20),
  flag VARCHAR(100),
  type VARCHAR(100),
  details JSONB DEFAULT '{}',
  workspace_id UUID REFERENCES workspaces(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel Positions (time-series)
CREATE TABLE vessel_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID REFERENCES vessels(id),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  destination VARCHAR(255),
  eta TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for time-series (if using TimescaleDB)
-- SELECT create_hypertable('vessel_positions', 'recorded_at');

-- Ports
CREATE TABLE ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  unlocode VARCHAR(10) UNIQUE NOT NULL,
  country VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  timezone VARCHAR(50),
  facilities JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active'
);

-- Port Calls
CREATE TABLE port_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  vessel_id UUID REFERENCES vessels(id) NOT NULL,
  port_id UUID REFERENCES ports(id) NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',

  eta TIMESTAMPTZ,
  etd TIMESTAMPTZ,
  ata TIMESTAMPTZ,
  atd TIMESTAMPTZ,

  berth_name VARCHAR(255),
  berth_terminal VARCHAR(255),
  berth_confirmed_at TIMESTAMPTZ,

  agent_id UUID,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Types
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  default_specifications JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active'
);

-- Service Orders
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_call_id UUID REFERENCES port_calls(id) NOT NULL,
  service_type_id UUID REFERENCES service_types(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',

  description TEXT,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  specifications JSONB DEFAULT '{}',

  requested_date TIMESTAMPTZ,
  confirmed_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  vendor_id UUID,

  quoted_price DECIMAL(12, 2),
  final_price DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  rfq_id UUID,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFQs
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  service_order_id UUID REFERENCES service_orders(id),
  port_call_id UUID REFERENCES port_calls(id),
  status VARCHAR(50) DEFAULT 'draft',

  service_type_id UUID REFERENCES service_types(id),
  description TEXT,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  specifications JSONB DEFAULT '{}',
  delivery_date TIMESTAMPTZ,

  deadline TIMESTAMPTZ NOT NULL,

  invited_vendors UUID[] DEFAULT '{}',

  awarded_quote_id UUID,
  awarded_at TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES rfqs(id) NOT NULL,
  vendor_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted',

  unit_price DECIMAL(12, 2),
  total_price DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  payment_terms VARCHAR(100),
  delivery_date TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  notes TEXT,
  attachments JSONB DEFAULT '[]',

  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),

  registration_number VARCHAR(100),
  address JSONB DEFAULT '{}',
  contacts JSONB DEFAULT '[]',
  bank_details JSONB DEFAULT '{}',

  service_types UUID[] DEFAULT '{}',
  ports UUID[] DEFAULT '{}',
  certifications JSONB DEFAULT '[]',

  rating DECIMAL(3, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  on_time_delivery DECIMAL(5, 2) DEFAULT 0,
  response_time DECIMAL(5, 2) DEFAULT 0,

  status VARCHAR(50) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,

  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',

  port_call_id UUID REFERENCES port_calls(id),
  vessel_id UUID REFERENCES vessels(id),
  service_order_id UUID REFERENCES service_orders(id),

  assigned_to UUID REFERENCES users(id),

  timeline JSONB DEFAULT '[]',

  resolved_at TIMESTAMPTZ,
  resolution TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,

  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,

  data JSONB DEFAULT '{}',
  link VARCHAR(500),

  channels VARCHAR(50)[] DEFAULT '{"in_app"}',

  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  trigger_event VARCHAR(100) NOT NULL,
  trigger_conditions JSONB DEFAULT '[]',

  actions JSONB DEFAULT '[]',

  status VARCHAR(50) DEFAULT 'draft',

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (for comms)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type VARCHAR(50) NOT NULL,
  channel_id UUID NOT NULL,

  sender_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',

  read_by JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_port_calls_vessel ON port_calls(vessel_id);
CREATE INDEX idx_port_calls_port ON port_calls(port_id);
CREATE INDEX idx_port_calls_workspace ON port_calls(workspace_id);
CREATE INDEX idx_port_calls_status ON port_calls(status);
CREATE INDEX idx_port_calls_eta ON port_calls(eta);

CREATE INDEX idx_service_orders_port_call ON service_orders(port_call_id);
CREATE INDEX idx_service_orders_vendor ON service_orders(vendor_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);

CREATE INDEX idx_rfqs_port_call ON rfqs(port_call_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_deadline ON rfqs(deadline);

CREATE INDEX idx_quotes_rfq ON quotes(rfq_id);
CREATE INDEX idx_quotes_vendor ON quotes(vendor_id);

CREATE INDEX idx_vessel_positions_vessel ON vessel_positions(vessel_id);
CREATE INDEX idx_vessel_positions_recorded ON vessel_positions(recorded_at DESC);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX idx_messages_channel ON messages(channel_type, channel_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

## Deployment Architecture

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CloudFlare                                │
│                        (CDN + WAF + DNS)                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────┴─────┐             ┌─────┴─────┐
              │    ALB    │             │    ALB    │
              │  (Public) │             │ (Internal)│
              └─────┬─────┘             └─────┬─────┘
                    │                         │
         ┌──────────┼──────────┐              │
         │          │          │              │
    ┌────┴────┐ ┌───┴───┐ ┌────┴────┐   ┌────┴────┐
    │ Web App │ │  API  │ │WebSocket│   │ Workers │
    │  (ECS)  │ │ (ECS) │ │  (ECS)  │   │  (ECS)  │
    └─────────┘ └───────┘ └─────────┘   └─────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────┴────┐ ┌───┴───┐ ┌────┴────┐
    │PostgreSQL│ │ Redis │ │   S3   │
    │  (RDS)  │ │(Cache)│ │(Files) │
    └─────────┘ └───────┘ └─────────┘
```

### Environment Configuration

```yaml
# Production
production:
  domains:
    platform: key.porttask.com
    portal: portal.porttask.com
    vendor: vendor.porttask.com
    api: api.porttask.com

  database:
    host: porttask-prod.cluster-xxx.region.rds.amazonaws.com
    replicas: 2

  redis:
    host: porttask-prod.xxx.cache.amazonaws.com

  scaling:
    api_min: 3
    api_max: 10
    web_min: 2
    web_max: 6

# Staging
staging:
  domains:
    platform: key.staging.porttask.com
    portal: portal.staging.porttask.com
    vendor: vendor.staging.porttask.com
    api: api.staging.porttask.com
```

---

## Security Implementation

### Authentication Flow

```typescript
// JWT-based authentication
interface AuthTokens {
  accessToken: string;   // Short-lived (15 min)
  refreshToken: string;  // Long-lived (7 days)
}

// Token payload
interface TokenPayload {
  userId: string;
  organizationId: string;
  portalType: 'platform' | 'portal' | 'vendor';
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

// Authentication middleware
const authenticate = async (req: Request): Promise<User> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  const user = await userService.findById(payload.userId);

  if (!user || user.status !== 'active') {
    throw new UnauthorizedError('Invalid user');
  }

  return user;
};
```

### Authorization

```typescript
// Permission checking middleware
const authorize = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!hasPermission(user, requiredPermission)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Data scoping middleware
const scopeToUserAccess = async (req: AuthenticatedRequest) => {
  const user = req.user;

  switch (user.portalType) {
    case 'platform':
      req.scope = { organizationId: user.organizationId };
      break;
    case 'portal':
      req.scope = getUserPortalScope(user);
      break;
    case 'vendor':
      req.scope = { vendorId: user.vendorId };
      break;
  }
};
```

### Rate Limiting

```typescript
const rateLimits = {
  api: {
    windowMs: 60 * 1000,      // 1 minute
    max: 100,                  // 100 requests per minute
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts per 15 minutes
  },
  rfqSubmit: {
    windowMs: 60 * 1000,
    max: 10,
  },
};
```

---

## Monitoring & Observability

### Logging

```typescript
// Structured logging
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json(),
  ),
  defaultMeta: {
    service: 'porttask-api',
    environment: process.env.NODE_ENV,
  },
});

// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
    });
  });

  next();
};
```

### Metrics

```typescript
// Key metrics to track
const metrics = {
  // Business metrics
  portCallsCreated: new Counter('port_calls_created_total'),
  rfqsSent: new Counter('rfqs_sent_total'),
  quotesReceived: new Counter('quotes_received_total'),
  serviceOrdersCompleted: new Counter('service_orders_completed_total'),

  // Performance metrics
  apiLatency: new Histogram('api_latency_seconds'),
  dbQueryDuration: new Histogram('db_query_duration_seconds'),
  wsConnections: new Gauge('websocket_connections'),

  // Error metrics
  apiErrors: new Counter('api_errors_total'),
  authFailures: new Counter('auth_failures_total'),
};
```

### Alerting Rules

```yaml
alerts:
  - name: HighErrorRate
    condition: rate(api_errors_total[5m]) > 0.05
    severity: critical

  - name: SlowAPIResponse
    condition: histogram_quantile(0.95, api_latency_seconds) > 2
    severity: warning

  - name: DatabaseConnectionHigh
    condition: db_connections > 80
    severity: warning

  - name: RFQDeadlineApproaching
    condition: rfq_deadline_hours < 2 AND quotes_count = 0
    severity: warning
```

---

## Testing Strategy

### Test Pyramid

```
         ┌─────────┐
         │   E2E   │  ← Few, critical paths
         ├─────────┤
         │  Integ  │  ← API, database
         ├─────────┤
         │  Unit   │  ← Business logic
         └─────────┘
```

### Test Examples

```typescript
// Unit test - Service logic
describe('RFQService', () => {
  describe('awardQuote', () => {
    it('should update RFQ status and create service order', async () => {
      const rfq = await rfqService.awardQuote(rfqId, quoteId);

      expect(rfq.status).toBe('awarded');
      expect(rfq.awardedQuoteId).toBe(quoteId);

      const serviceOrder = await serviceOrderService.findByRfqId(rfqId);
      expect(serviceOrder.vendorId).toBe(quote.vendorId);
      expect(serviceOrder.status).toBe('confirmed');
    });
  });
});

// Integration test - API
describe('POST /api/port-calls', () => {
  it('should create port call and notify stakeholders', async () => {
    const response = await request(app)
      .post('/api/port-calls')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        vesselId: vessel.id,
        portId: port.id,
        eta: '2024-12-15T14:00:00Z',
        etd: '2024-12-17T10:00:00Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.reference).toMatch(/^PC-\d+$/);

    // Verify notifications sent
    const notifications = await notificationService.findByEntityId(response.body.id);
    expect(notifications.length).toBeGreaterThan(0);
  });
});

// E2E test - Critical flow
describe('RFQ to Service Order flow', () => {
  it('should complete full procurement cycle', async () => {
    // 1. Operator creates service order
    const serviceOrder = await createServiceOrder(portCallId, 'bunkers');

    // 2. Operator creates RFQ
    const rfq = await createRFQ(serviceOrder.id, [vendor1.id, vendor2.id]);

    // 3. Vendor submits quote
    await loginAsVendor(vendor1);
    const quote = await submitQuote(rfq.id, { unitPrice: 630 });

    // 4. Operator awards quote
    await loginAsOperator();
    await awardQuote(rfq.id, quote.id);

    // 5. Verify service order updated
    const updatedOrder = await getServiceOrder(serviceOrder.id);
    expect(updatedOrder.vendorId).toBe(vendor1.id);
    expect(updatedOrder.status).toBe('confirmed');
  });
});
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
