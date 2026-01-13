# Navo API Reference

Welcome to the Navo Maritime Operations Platform API documentation.

## Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://api.navo.io/api/v1` |
| Staging | `https://api.staging.navo.io/api/v1` |
| Development | `http://localhost:4000/api/v1` |

## Authentication

All API requests (except auth endpoints) require a valid JWT access token.

### Obtaining Tokens

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Using Tokens

Include the access token in the `Authorization` header:

```bash
Authorization: Bearer <access_token>
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to obtain new tokens:

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

---

## Request Format

### Headers

| Header | Description | Required |
|--------|-------------|----------|
| `Authorization` | Bearer token | Yes (protected routes) |
| `Content-Type` | `application/json` | Yes (POST/PUT) |
| `X-Workspace-ID` | Target workspace | Optional |
| `X-Request-ID` | Correlation ID | Optional |

### Pagination

List endpoints support pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 100) |

### Filtering

Many endpoints support filtering via query parameters:

```bash
GET /api/v1/port-calls?status=confirmed&port_id=p_abc123
```

### Sorting

Use `sort` parameter with optional `-` prefix for descending:

```bash
GET /api/v1/port-calls?sort=-eta    # Sort by ETA descending
GET /api/v1/port-calls?sort=status  # Sort by status ascending
```

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "email"
    }
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests / 15 min |
| API (authenticated) | 1000 requests / min |
| API (unauthenticated) | 100 requests / min |

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Complete password reset |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/profile` | Update profile |
| PUT | `/auth/password` | Change password |

### Port Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/port-calls` | List port calls |
| POST | `/port-calls` | Create port call |
| GET | `/port-calls/:id` | Get port call |
| PUT | `/port-calls/:id` | Update port call |
| DELETE | `/port-calls/:id` | Delete port call |
| POST | `/port-calls/:id/status` | Update status |
| GET | `/port-calls/:id/timeline` | Get timeline |
| GET | `/port-calls/:id/services` | Get services |
| GET | `/port-calls/:id/documents` | Get documents |

### Service Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/service-orders` | List service orders |
| POST | `/service-orders` | Create service order |
| GET | `/service-orders/:id` | Get service order |
| PUT | `/service-orders/:id` | Update service order |
| DELETE | `/service-orders/:id` | Delete service order |
| POST | `/service-orders/:id/assign` | Assign vendor |
| POST | `/service-orders/:id/complete` | Mark complete |

### RFQs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rfqs` | List RFQs |
| POST | `/rfqs` | Create RFQ |
| GET | `/rfqs/:id` | Get RFQ |
| PUT | `/rfqs/:id` | Update RFQ |
| DELETE | `/rfqs/:id` | Delete RFQ |
| POST | `/rfqs/:id/publish` | Publish RFQ |
| POST | `/rfqs/:id/invite` | Invite vendors |
| GET | `/rfqs/:id/quotes` | Get quotes |
| POST | `/rfqs/:id/quotes` | Submit quote |
| POST | `/rfqs/:id/award` | Award to vendor |

### Vessels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vessels` | List vessels |
| POST | `/vessels` | Create vessel |
| GET | `/vessels/:id` | Get vessel |
| PUT | `/vessels/:id` | Update vessel |
| DELETE | `/vessels/:id` | Delete vessel |
| GET | `/vessels/:id/position` | Get current position |
| GET | `/vessels/:id/track` | Get position history |

### Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/positions/current` | Get all current positions |
| GET | `/positions/fleet` | Get fleet overview |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendors` | List vendors |
| POST | `/vendors` | Create vendor |
| GET | `/vendors/:id` | Get vendor |
| PUT | `/vendors/:id` | Update vendor |
| DELETE | `/vendors/:id` | Delete vendor |
| GET | `/vendors/:id/services` | Get vendor services |
| GET | `/vendors/:id/ratings` | Get vendor ratings |

### Ports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ports` | List ports |
| GET | `/ports/:id` | Get port |
| GET | `/ports/search` | Search ports |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents |
| POST | `/documents` | Upload document |
| GET | `/documents/:id` | Get document |
| DELETE | `/documents/:id` | Delete document |
| GET | `/documents/:id/download` | Download file |
| POST | `/documents/:id/share` | Share document |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/preferences` | Get preferences |
| PUT | `/notifications/preferences` | Update preferences |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard KPIs |
| GET | `/analytics/port-calls` | Port call analytics |
| GET | `/analytics/services` | Service analytics |
| GET | `/analytics/vendors` | Vendor performance |
| GET | `/analytics/export` | Export report |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

---

## WebSocket API

Connect to the WebSocket endpoint for real-time updates:

```javascript
const ws = new WebSocket('wss://api.navo.io/ws?token=<access_token>');
```

### Subscribe to Topics

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: [
    'workspace:ws_123:port_calls',
    'vessel:v_456:position'
  ]
}));
```

### Event Types

| Event | Payload |
|-------|---------|
| `port_call:created` | PortCall object |
| `port_call:updated` | PortCall object |
| `port_call:status_changed` | `{id, old_status, new_status}` |
| `vessel:position_updated` | Position object |
| `service:created` | ServiceOrder object |
| `service:updated` | ServiceOrder object |
| `rfq:created` | RFQ object |
| `rfq:quote_received` | Quote object |
| `notification:new` | Notification object |

### Unsubscribe

```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  topics: ['vessel:v_456:position']
}));
```

---

## SDKs and Client Libraries

### JavaScript/TypeScript

```bash
npm install @navo/client
```

```typescript
import { NavoClient } from '@navo/client';

const client = new NavoClient({
  baseUrl: 'https://api.navo.io',
  token: 'your-access-token'
});

const portCalls = await client.portCalls.list({ status: 'confirmed' });
```

### Python

```bash
pip install navo-client
```

```python
from navo import NavoClient

client = NavoClient(
    base_url='https://api.navo.io',
    token='your-access-token'
)

port_calls = client.port_calls.list(status='confirmed')
```

---

## OpenAPI Specification

The full OpenAPI 3.1 specification is available at:

- **JSON**: `https://api.navo.io/openapi.json`
- **YAML**: `https://api.navo.io/openapi.yaml`
- **Swagger UI**: `https://api.navo.io/docs`

---

## Detailed Endpoint Documentation

### Authentication Endpoints

#### POST /auth/login

Authenticate a user and receive access/refresh tokens.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@maritime.com",
    "password": "SecurePassword123!"
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "usr_abc123xyz",
      "email": "operator@maritime.com",
      "name": "John Smith",
      "role": "operator",
      "organization_id": "org_def456",
      "organization_name": "Maritime Corp",
      "workspaces": [
        {
          "id": "ws_ghi789",
          "name": "Singapore Operations"
        },
        {
          "id": "ws_jkl012",
          "name": "Rotterdam Operations"
        }
      ]
    }
  }
}
```

**Error Responses:**

```json
// 401 - Invalid credentials
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

// 403 - Account locked
{
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account locked due to too many failed attempts. Try again in 30 minutes.",
    "details": {
      "locked_until": "2024-01-15T10:30:00Z",
      "attempts": 5
    }
  }
}
```

---

#### POST /auth/refresh

Refresh an expired access token using a valid refresh token.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

---

#### GET /auth/me

Get the current authenticated user's profile.

**Request:**

```bash
curl -X GET https://api.navo.io/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Success Response (200):**

```json
{
  "data": {
    "id": "usr_abc123xyz",
    "email": "operator@maritime.com",
    "name": "John Smith",
    "avatar_url": "https://storage.navo.io/avatars/usr_abc123xyz.jpg",
    "role": "operator",
    "permissions": [
      "port_calls:read",
      "port_calls:write",
      "services:read",
      "services:write",
      "vessels:read"
    ],
    "organization": {
      "id": "org_def456",
      "name": "Maritime Corp",
      "logo_url": "https://storage.navo.io/logos/org_def456.png"
    },
    "workspaces": [
      {
        "id": "ws_ghi789",
        "name": "Singapore Operations",
        "is_default": true
      }
    ],
    "preferences": {
      "timezone": "Asia/Singapore",
      "locale": "en-US",
      "date_format": "YYYY-MM-DD",
      "notifications": {
        "email": true,
        "push": true,
        "desktop": false
      }
    },
    "created_at": "2024-01-10T08:00:00Z",
    "last_login_at": "2024-01-15T09:30:00Z"
  }
}
```

---

### Port Call Endpoints

#### GET /port-calls

List port calls with filtering, sorting, and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workspace_id` | uuid | Filter by workspace |
| `status` | string | Filter by status: `draft`, `planned`, `confirmed`, `arrived`, `alongside`, `departed`, `completed`, `cancelled` |
| `vessel_id` | uuid | Filter by vessel |
| `port_id` | uuid | Filter by port |
| `eta_from` | ISO 8601 | Filter ETA >= date |
| `eta_to` | ISO 8601 | Filter ETA <= date |
| `agent_id` | uuid | Filter by assigned agent |
| `search` | string | Search vessel name, reference |
| `sort` | string | Sort field (prefix with `-` for desc) |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 20, max: 100) |

**Request:**

```bash
curl -X GET "https://api.navo.io/api/v1/port-calls?status=confirmed&eta_from=2024-01-15&sort=-eta&per_page=10" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Workspace-ID: ws_ghi789"
```

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "pc_123abc",
      "reference": "PC-2024-0001",
      "status": "confirmed",
      "vessel": {
        "id": "vsl_456def",
        "name": "MV Pacific Star",
        "imo": "9123456",
        "flag": "SG",
        "type": "container"
      },
      "port": {
        "id": "prt_789ghi",
        "name": "Port of Singapore",
        "locode": "SGSIN",
        "country": "Singapore"
      },
      "berth": {
        "id": "brth_012jkl",
        "name": "Berth 7A",
        "confirmed": true
      },
      "eta": "2024-01-20T08:00:00Z",
      "etd": "2024-01-22T18:00:00Z",
      "ata": null,
      "atd": null,
      "cargo": {
        "type": "container",
        "quantity": 2500,
        "unit": "TEU"
      },
      "agent": {
        "id": "usr_mno345",
        "name": "Sarah Lee"
      },
      "services_count": 5,
      "documents_count": 12,
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-14T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 47,
    "total_pages": 5
  }
}
```

---

#### POST /port-calls

Create a new port call.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/port-calls \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "X-Workspace-ID: ws_ghi789" \
  -d '{
    "vessel_id": "vsl_456def",
    "port_id": "prt_789ghi",
    "eta": "2024-01-20T08:00:00Z",
    "etd": "2024-01-22T18:00:00Z",
    "berth_id": "brth_012jkl",
    "cargo": {
      "type": "container",
      "quantity": 2500,
      "unit": "TEU",
      "description": "General cargo containers"
    },
    "voyage_number": "VOY-2024-001",
    "agent_id": "usr_mno345",
    "notes": "First call of the year. VIP charter.",
    "custom_fields": {
      "charter_party": "CP-2024-001",
      "priority": "high"
    }
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "id": "pc_new123",
    "reference": "PC-2024-0048",
    "status": "draft",
    "vessel": {
      "id": "vsl_456def",
      "name": "MV Pacific Star",
      "imo": "9123456"
    },
    "port": {
      "id": "prt_789ghi",
      "name": "Port of Singapore"
    },
    "eta": "2024-01-20T08:00:00Z",
    "etd": "2024-01-22T18:00:00Z",
    "created_at": "2024-01-15T09:45:00Z",
    "created_by": {
      "id": "usr_abc123xyz",
      "name": "John Smith"
    }
  }
}
```

**Validation Errors (422):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "eta",
          "message": "ETA must be in the future"
        },
        {
          "field": "etd",
          "message": "ETD must be after ETA"
        }
      ]
    }
  }
}
```

---

#### GET /port-calls/:id

Get a single port call with full details.

**Request:**

```bash
curl -X GET https://api.navo.io/api/v1/port-calls/pc_123abc \
  -H "Authorization: Bearer <access_token>"
```

**Success Response (200):**

```json
{
  "data": {
    "id": "pc_123abc",
    "reference": "PC-2024-0001",
    "status": "alongside",
    "vessel": {
      "id": "vsl_456def",
      "name": "MV Pacific Star",
      "imo": "9123456",
      "mmsi": "563456789",
      "flag": "SG",
      "type": "container",
      "loa": 294.0,
      "beam": 32.3,
      "draft": 12.5,
      "dwt": 80000,
      "built_year": 2018,
      "owner": {
        "id": "org_owner123",
        "name": "Pacific Shipping Ltd"
      }
    },
    "port": {
      "id": "prt_789ghi",
      "name": "Port of Singapore",
      "locode": "SGSIN",
      "country": "Singapore",
      "timezone": "Asia/Singapore"
    },
    "berth": {
      "id": "brth_012jkl",
      "name": "Berth 7A",
      "terminal": "PSA Pasir Panjang",
      "confirmed": true,
      "confirmed_at": "2024-01-18T10:00:00Z"
    },
    "eta": "2024-01-20T08:00:00Z",
    "etd": "2024-01-22T18:00:00Z",
    "ata": "2024-01-20T07:45:00Z",
    "atd": null,
    "voyage_number": "VOY-2024-001",
    "cargo": {
      "type": "container",
      "quantity": 2500,
      "unit": "TEU",
      "description": "General cargo containers"
    },
    "agent": {
      "id": "usr_mno345",
      "name": "Sarah Lee",
      "email": "sarah.lee@maritime.com",
      "phone": "+65 9876 5432"
    },
    "services": [
      {
        "id": "so_svc001",
        "service_type": "pilotage",
        "status": "completed",
        "vendor": {
          "id": "vnd_pilot1",
          "name": "Singapore Pilots"
        }
      },
      {
        "id": "so_svc002",
        "service_type": "towage",
        "status": "in_progress",
        "vendor": {
          "id": "vnd_tow1",
          "name": "Harbor Tugs Pte Ltd"
        }
      }
    ],
    "timeline": [
      {
        "id": "evt_001",
        "event": "created",
        "timestamp": "2024-01-10T10:00:00Z",
        "actor": {
          "id": "usr_abc123xyz",
          "name": "John Smith"
        }
      },
      {
        "id": "evt_002",
        "event": "status_changed",
        "timestamp": "2024-01-12T14:30:00Z",
        "data": {
          "from": "draft",
          "to": "planned"
        },
        "actor": {
          "id": "usr_abc123xyz",
          "name": "John Smith"
        }
      }
    ],
    "notes": "First call of the year. VIP charter.",
    "custom_fields": {
      "charter_party": "CP-2024-001",
      "priority": "high"
    },
    "workspace_id": "ws_ghi789",
    "organization_id": "org_def456",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-20T07:45:00Z",
    "created_by": {
      "id": "usr_abc123xyz",
      "name": "John Smith"
    }
  }
}
```

---

#### POST /port-calls/:id/status

Update the status of a port call.

**Valid Transitions:**

| From | To |
|------|-----|
| `draft` | `planned`, `cancelled` |
| `planned` | `confirmed`, `cancelled` |
| `confirmed` | `arrived`, `cancelled` |
| `arrived` | `alongside` |
| `alongside` | `departed` |
| `departed` | `completed` |

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/port-calls/pc_123abc/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "arrived",
    "timestamp": "2024-01-20T07:45:00Z",
    "notes": "Vessel arrived at anchorage"
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "id": "pc_123abc",
    "status": "arrived",
    "previous_status": "confirmed",
    "ata": "2024-01-20T07:45:00Z",
    "timeline_event": {
      "id": "evt_005",
      "event": "status_changed",
      "timestamp": "2024-01-20T07:45:00Z",
      "data": {
        "from": "confirmed",
        "to": "arrived"
      }
    },
    "updated_at": "2024-01-20T07:45:00Z"
  }
}
```

**Invalid Transition (422):**

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'arrived' to 'confirmed'",
    "details": {
      "current_status": "arrived",
      "requested_status": "confirmed",
      "valid_transitions": ["alongside"]
    }
  }
}
```

---

### Service Order Endpoints

#### POST /service-orders

Create a new service order for a port call.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/service-orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "port_call_id": "pc_123abc",
    "service_type": "bunkering",
    "requested_date": "2024-01-21T10:00:00Z",
    "description": "MGO bunkering - 500 MT",
    "specifications": {
      "fuel_type": "MGO",
      "quantity_mt": 500,
      "sulfur_content": "0.1%"
    },
    "vendor_id": "vnd_bunker1",
    "priority": "normal",
    "special_instructions": "Vessel has ISO tanks. Coordinate with chief engineer."
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "id": "so_new789",
    "reference": "SO-2024-0125",
    "port_call_id": "pc_123abc",
    "service_type": "bunkering",
    "status": "requested",
    "requested_date": "2024-01-21T10:00:00Z",
    "description": "MGO bunkering - 500 MT",
    "vendor": {
      "id": "vnd_bunker1",
      "name": "Singapore Bunkers Pte Ltd"
    },
    "estimated_cost": null,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### POST /service-orders/:id/assign

Assign a vendor to a service order.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/service-orders/so_new789/assign \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "vnd_bunker2",
    "estimated_cost": {
      "amount": 450000,
      "currency": "USD"
    },
    "scheduled_date": "2024-01-21T10:00:00Z",
    "notify_vendor": true,
    "notes": "Confirmed rate as per contract"
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "id": "so_new789",
    "status": "confirmed",
    "vendor": {
      "id": "vnd_bunker2",
      "name": "Ocean Fuels International",
      "contact": {
        "name": "David Tan",
        "email": "david@oceanfuels.com",
        "phone": "+65 9123 4567"
      }
    },
    "estimated_cost": {
      "amount": 450000,
      "currency": "USD"
    },
    "scheduled_date": "2024-01-21T10:00:00Z",
    "notification_sent": true,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### RFQ Endpoints

#### POST /rfqs

Create a Request for Quotation.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/rfqs \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_order_id": "so_new789",
    "title": "Bunkering RFQ - MV Pacific Star",
    "description": "Request for MGO bunkering services",
    "deadline": "2024-01-18T17:00:00Z",
    "specifications": {
      "fuel_type": "MGO",
      "quantity_mt": 500,
      "delivery_date": "2024-01-21",
      "delivery_location": "Alongside at Berth 7A",
      "sulfur_content": "0.1% max",
      "iso_specs": "ISO 8217:2017 DMA"
    },
    "required_documents": [
      "Bunker Delivery Note",
      "Certificate of Quality",
      "MSDS"
    ],
    "terms": "Payment within 30 days of delivery"
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "id": "rfq_abc123",
    "reference": "RFQ-2024-0089",
    "title": "Bunkering RFQ - MV Pacific Star",
    "status": "draft",
    "deadline": "2024-01-18T17:00:00Z",
    "service_order_id": "so_new789",
    "invited_vendors": [],
    "quotes_count": 0,
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

---

#### POST /rfqs/:id/invite

Invite vendors to submit quotes.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/rfqs/rfq_abc123/invite \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_ids": ["vnd_bunker1", "vnd_bunker2", "vnd_bunker3"],
    "message": "We invite you to submit a quote for bunkering services.",
    "send_email": true
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "id": "rfq_abc123",
    "status": "published",
    "invited_vendors": [
      {
        "id": "vnd_bunker1",
        "name": "Singapore Bunkers Pte Ltd",
        "invited_at": "2024-01-15T11:30:00Z",
        "email_sent": true
      },
      {
        "id": "vnd_bunker2",
        "name": "Ocean Fuels International",
        "invited_at": "2024-01-15T11:30:00Z",
        "email_sent": true
      },
      {
        "id": "vnd_bunker3",
        "name": "Asia Pacific Bunkers",
        "invited_at": "2024-01-15T11:30:00Z",
        "email_sent": true
      }
    ],
    "deadline": "2024-01-18T17:00:00Z"
  }
}
```

---

#### POST /rfqs/:id/quotes (Vendor)

Submit a quote in response to an RFQ.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/rfqs/rfq_abc123/quotes \
  -H "Authorization: Bearer <vendor_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": {
      "amount": 890,
      "currency": "USD",
      "unit": "per_mt"
    },
    "total_amount": 445000,
    "validity_period": "2024-01-25T17:00:00Z",
    "delivery_terms": "Delivery alongside at Berth 7A, 21 Jan 2024 between 0800-1200",
    "payment_terms": "Net 30 days from BDN date",
    "attachments": [
      {
        "name": "Product Specification",
        "document_id": "doc_spec123"
      }
    ],
    "notes": "Price includes delivery and all duties. MARPOL compliant fuel guaranteed."
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "id": "quote_xyz789",
    "rfq_id": "rfq_abc123",
    "vendor": {
      "id": "vnd_bunker2",
      "name": "Ocean Fuels International"
    },
    "price": {
      "amount": 890,
      "currency": "USD",
      "unit": "per_mt"
    },
    "total_amount": 445000,
    "validity_period": "2024-01-25T17:00:00Z",
    "status": "submitted",
    "submitted_at": "2024-01-16T09:00:00Z"
  }
}
```

---

#### POST /rfqs/:id/award

Award an RFQ to a vendor.

**Request:**

```bash
curl -X POST https://api.navo.io/api/v1/rfqs/rfq_abc123/award \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_id": "quote_xyz789",
    "vendor_id": "vnd_bunker2",
    "notify_all_vendors": true,
    "notes": "Selected based on competitive pricing and delivery schedule"
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "id": "rfq_abc123",
    "status": "awarded",
    "awarded_to": {
      "vendor_id": "vnd_bunker2",
      "vendor_name": "Ocean Fuels International",
      "quote_id": "quote_xyz789",
      "amount": 445000,
      "currency": "USD"
    },
    "service_order": {
      "id": "so_new789",
      "status": "confirmed",
      "vendor_id": "vnd_bunker2"
    },
    "awarded_at": "2024-01-17T14:00:00Z",
    "awarded_by": {
      "id": "usr_mno345",
      "name": "Sarah Lee"
    },
    "notifications_sent": [
      {
        "vendor_id": "vnd_bunker1",
        "type": "not_awarded"
      },
      {
        "vendor_id": "vnd_bunker2",
        "type": "awarded"
      },
      {
        "vendor_id": "vnd_bunker3",
        "type": "not_awarded"
      }
    ]
  }
}
```

---

### Vessel Endpoints

#### GET /vessels/:id/position

Get the current position of a vessel.

**Request:**

```bash
curl -X GET https://api.navo.io/api/v1/vessels/vsl_456def/position \
  -H "Authorization: Bearer <access_token>"
```

**Success Response (200):**

```json
{
  "data": {
    "vessel_id": "vsl_456def",
    "timestamp": "2024-01-15T10:45:00Z",
    "position": {
      "latitude": 1.2644,
      "longitude": 103.8200
    },
    "navigation": {
      "speed_knots": 12.5,
      "course": 45,
      "heading": 47,
      "status": "underway_using_engine"
    },
    "destination": {
      "port_locode": "SGSIN",
      "port_name": "Port of Singapore",
      "eta": "2024-01-20T08:00:00Z"
    },
    "source": "ais",
    "accuracy": "high"
  }
}
```

---

#### GET /vessels/:id/track

Get position history for a vessel.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | ISO 8601 | Start date (required) |
| `to` | ISO 8601 | End date (default: now) |
| `resolution` | string | `raw`, `hourly`, `daily` (default: hourly) |

**Request:**

```bash
curl -X GET "https://api.navo.io/api/v1/vessels/vsl_456def/track?from=2024-01-10&to=2024-01-15&resolution=hourly" \
  -H "Authorization: Bearer <access_token>"
```

**Success Response (200):**

```json
{
  "data": {
    "vessel_id": "vsl_456def",
    "period": {
      "from": "2024-01-10T00:00:00Z",
      "to": "2024-01-15T10:00:00Z"
    },
    "resolution": "hourly",
    "positions": [
      {
        "timestamp": "2024-01-10T00:00:00Z",
        "latitude": 22.3080,
        "longitude": 114.1740,
        "speed_knots": 0,
        "status": "at_anchor"
      },
      {
        "timestamp": "2024-01-10T01:00:00Z",
        "latitude": 22.3082,
        "longitude": 114.1738,
        "speed_knots": 0,
        "status": "at_anchor"
      }
    ],
    "summary": {
      "total_positions": 120,
      "distance_nm": 1245.6,
      "average_speed_knots": 10.4
    }
  }
}
```

---

### Document Endpoints

#### POST /documents

Upload a document.

**Request (multipart/form-data):**

```bash
curl -X POST https://api.navo.io/api/v1/documents \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/document.pdf" \
  -F "name=Bunker Delivery Note" \
  -F "entity_type=port_call" \
  -F "entity_id=pc_123abc" \
  -F "category=operational" \
  -F "tags=bunker,delivery"
```

**Success Response (201):**

```json
{
  "data": {
    "id": "doc_upload123",
    "name": "Bunker Delivery Note",
    "file_name": "document.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 245760,
    "category": "operational",
    "tags": ["bunker", "delivery"],
    "entity_type": "port_call",
    "entity_id": "pc_123abc",
    "url": "https://storage.navo.io/documents/doc_upload123/document.pdf",
    "uploaded_by": {
      "id": "usr_abc123xyz",
      "name": "John Smith"
    },
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

---

## WebSocket API Details

### Connection

**URL:** `wss://api.navo.io/ws`

**Authentication:** Include access token as query parameter or header.

```javascript
// Option 1: Query parameter
const ws = new WebSocket('wss://api.navo.io/ws?token=<access_token>');

// Option 2: Protocol header (for browsers that support it)
const ws = new WebSocket('wss://api.navo.io/ws', ['access_token', '<access_token>']);
```

### Message Format

All messages are JSON objects with a `type` field.

**Client → Server:**

```typescript
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  topics?: string[];
  id?: string;  // Optional correlation ID
}
```

**Server → Client:**

```typescript
interface ServerMessage {
  type: 'event' | 'subscribed' | 'unsubscribed' | 'error' | 'pong';
  topic?: string;
  event?: string;
  data?: any;
  id?: string;
  timestamp: string;
}
```

### Subscription Topics

| Topic Pattern | Description | Example |
|---------------|-------------|---------|
| `workspace:{id}:port_calls` | Port call events in workspace | `workspace:ws_123:port_calls` |
| `port_call:{id}` | Single port call updates | `port_call:pc_abc:*` |
| `vessel:{id}:position` | Vessel position updates | `vessel:vsl_456:position` |
| `workspace:{id}:services` | Service order events | `workspace:ws_123:services` |
| `rfq:{id}` | RFQ events (quotes, status) | `rfq:rfq_789:*` |
| `user:{id}:notifications` | User notifications | `user:usr_abc:notifications` |

### Example Session

```javascript
const ws = new WebSocket('wss://api.navo.io/ws?token=<access_token>');

// Connection opened
ws.onopen = () => {
  // Subscribe to topics
  ws.send(JSON.stringify({
    type: 'subscribe',
    topics: [
      'workspace:ws_123:port_calls',
      'vessel:vsl_456:position',
      'user:usr_abc:notifications'
    ],
    id: 'sub_001'
  }));
};

// Handle messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'subscribed':
      console.log('Subscribed to:', message.topics);
      break;

    case 'event':
      console.log(`Event: ${message.event} on ${message.topic}`, message.data);
      // Handle specific events
      if (message.event === 'port_call:status_changed') {
        updatePortCallStatus(message.data);
      } else if (message.event === 'vessel:position_updated') {
        updateVesselMarker(message.data);
      }
      break;

    case 'error':
      console.error('WebSocket error:', message.data);
      break;
  }
};

// Heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

### Event Payloads

**port_call:status_changed:**

```json
{
  "type": "event",
  "topic": "workspace:ws_123:port_calls",
  "event": "port_call:status_changed",
  "data": {
    "id": "pc_123abc",
    "reference": "PC-2024-0001",
    "old_status": "confirmed",
    "new_status": "arrived",
    "timestamp": "2024-01-20T07:45:00Z",
    "actor": {
      "id": "usr_abc123xyz",
      "name": "John Smith"
    }
  },
  "timestamp": "2024-01-20T07:45:01Z"
}
```

**vessel:position_updated:**

```json
{
  "type": "event",
  "topic": "vessel:vsl_456:position",
  "event": "vessel:position_updated",
  "data": {
    "vessel_id": "vsl_456def",
    "position": {
      "latitude": 1.2644,
      "longitude": 103.8200
    },
    "speed_knots": 12.5,
    "course": 45,
    "timestamp": "2024-01-15T10:45:00Z"
  },
  "timestamp": "2024-01-15T10:45:02Z"
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token is malformed or invalid |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ACCOUNT_LOCKED` | 403 | Too many failed login attempts |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `INVALID_STATUS_TRANSITION` | 422 | Invalid status change |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Changelog

### v1.2.0 (Current)

- Added RFQ awarding endpoint
- Added vendor rating endpoint
- Improved position tracking accuracy
- Added WebSocket heartbeat support
- Enhanced error response details

### v1.1.0

- Added document sharing
- Added analytics export
- WebSocket authentication improvements
- Added batch operations

### v1.0.0

- Initial release
