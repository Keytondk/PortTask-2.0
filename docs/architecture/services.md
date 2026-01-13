# Navo Backend Services Documentation

This document provides comprehensive documentation for each backend service in the Navo platform, including architecture, implementation details, configuration, and operational guidance.

---

## Table of Contents

1. [Service Architecture Overview](#service-architecture-overview)
2. [API Gateway](#api-gateway)
3. [Auth Service](#auth-service)
4. [Core Service](#core-service)
5. [Vessel Service](#vessel-service)
6. [Realtime Service](#realtime-service)
7. [Notification Service](#notification-service)
8. [Analytics Service](#analytics-service)
9. [Worker Service](#worker-service)
10. [Shared Packages](#shared-packages)
11. [Service Communication Patterns](#service-communication-patterns)
12. [Error Handling Standards](#error-handling-standards)
13. [Monitoring and Observability](#monitoring-and-observability)
14. [Deployment Configuration](#deployment-configuration)

---

## Service Architecture Overview

### Microservices Design Principles

The Navo backend follows a microservices architecture with the following principles:

1. **Single Responsibility**: Each service owns a specific business domain
2. **Loose Coupling**: Services communicate via well-defined APIs
3. **High Cohesion**: Related functionality is grouped together
4. **Independent Deployment**: Each service can be deployed independently
5. **Data Ownership**: Each service owns its data and exposes it via APIs

### Service Registry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NAVO SERVICES                                  │
├─────────────────┬───────────┬───────────────────────────────────────────────┤
│ Service         │ Port      │ Description                                   │
├─────────────────┼───────────┼───────────────────────────────────────────────┤
│ Gateway         │ 4000      │ API Gateway, routing, authentication          │
│ Auth            │ 4001      │ User authentication, sessions, passwords      │
│ Core            │ 4002      │ Port calls, services, RFQs, vendors           │
│ Vessel          │ 4003      │ Vessel registry, AIS tracking, positions      │
│ Realtime        │ 4004      │ WebSocket connections, event broadcasting     │
│ Notification    │ 4005      │ Email, push notifications, preferences        │
│ Analytics       │ 4006      │ KPIs, reporting, data aggregation             │
│ Worker          │ 4007      │ Background jobs, scheduled tasks              │
└─────────────────┴───────────┴───────────────────────────────────────────────┘
```

### Technology Stack Per Service

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE TECHNOLOGY STACK                            │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ Language        │ Go 1.22                                                   │
│ HTTP Router     │ Chi v5                                                    │
│ Database        │ PostgreSQL 16 via pgx v5                                  │
│ Cache           │ Redis 7 via go-redis v9                                   │
│ Logging         │ Zap structured logging                                    │
│ Metrics         │ Prometheus client                                         │
│ Tracing         │ OpenTelemetry                                             │
│ Configuration   │ Environment variables + .env                              │
│ Validation      │ go-playground/validator v10                               │
│ Testing         │ testify + httptest                                        │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### Common Service Structure

All Go services follow this standardized directory structure:

```
services/{service-name}/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go           # Environment configuration
│   ├── model/
│   │   ├── domain.go           # Domain entities
│   │   └── dto.go              # Data transfer objects
│   ├── repository/
│   │   ├── repository.go       # Repository interface
│   │   └── postgres.go         # PostgreSQL implementation
│   ├── service/
│   │   └── service.go          # Business logic
│   ├── handler/
│   │   └── handler.go          # HTTP handlers
│   └── middleware/
│       └── middleware.go       # Service-specific middleware
├── pkg/                        # Public packages (if any)
├── Dockerfile
├── Makefile
└── go.mod
```

---

## API Gateway

**Location**: `services/gateway`
**Port**: 4000
**Health Check**: `GET /health`

### Purpose

The API Gateway serves as the single entry point for all client requests to the Navo platform. It handles:

- **Request Routing**: Routes requests to appropriate backend services
- **Authentication**: Validates JWT tokens and extracts user context
- **Authorization**: Enforces workspace access permissions
- **Rate Limiting**: Protects backend services from abuse
- **Security Headers**: Adds security headers to all responses
- **Request Logging**: Logs all incoming requests with correlation IDs
- **Metrics Collection**: Records request metrics for monitoring

### Detailed Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │           API GATEWAY               │
                                    │                                     │
                   ┌────────────────┤  ┌─────────────────────────────┐   │
                   │                │  │      Middleware Stack        │   │
                   │                │  │                              │   │
    ┌──────────┐   │   ┌────────┐   │  │  1. RequestID               │   │
    │  Client  │───┼───│  TLS   │───┼──│  2. SecurityHeaders         │   │
    └──────────┘   │   └────────┘   │  │  3. Logger                  │   │
                   │                │  │  4. Metrics                 │   │
                   │                │  │  5. RateLimiter             │   │
                   │                │  │  6. Authenticate            │   │
                   │                │  │  7. RequireWorkspaceAccess  │   │
                   │                │  └──────────────┬──────────────┘   │
                   │                │                 │                   │
                   │                │  ┌──────────────▼──────────────┐   │
                   │                │  │      Route Matching         │   │
                   │                │  │                              │   │
                   │                │  │  /api/v1/auth/*   → :4001   │   │
                   │                │  │  /api/v1/port-*   → :4002   │   │
                   │                │  │  /api/v1/vessels  → :4003   │   │
                   │                │  │  /ws/*            → :4004   │   │
                   │                │  └──────────────────────────────┘   │
                   │                │                                     │
                   └────────────────┴─────────────────────────────────────┘
                                                    │
                   ┌────────────────────────────────┼────────────────────────────┐
                   │                                │                            │
                   ▼                                ▼                            ▼
            ┌──────────┐                    ┌──────────┐                  ┌──────────┐
            │   Auth   │                    │   Core   │                  │  Vessel  │
            │  :4001   │                    │  :4002   │                  │  :4003   │
            └──────────┘                    └──────────┘                  └──────────┘
```

### Directory Structure

```
services/gateway/
├── cmd/
│   └── main.go                     # Application entry point
└── internal/
    ├── config/
    │   └── config.go               # Environment configuration
    │       • PORT                  # Server port (default: 4000)
    │       • JWT_SECRET            # JWT signing secret
    │       • *_SERVICE_URL         # Backend service URLs
    │       • RATE_LIMIT_RPS        # Requests per second limit
    │       • LOG_LEVEL             # Logging level
    │
    ├── middleware/
    │   ├── auth.go                 # JWT authentication middleware
    │   │   • Authenticate()        # Validates JWT tokens
    │   │   • RequirePermission()   # Checks specific permission
    │   │   • RequireWorkspaceAccess() # Validates workspace access
    │   │
    │   ├── security.go             # Security headers middleware
    │   │   • SecurityHeaders()     # Adds all security headers
    │   │   • CORS()                # CORS handling
    │   │
    │   ├── logger.go               # Request logging middleware
    │   │   • RequestLogger()       # Structured request logging
    │   │   • RequestID()           # Assigns unique request ID
    │   │
    │   ├── metrics.go              # Metrics collection middleware
    │   │   • Metrics()             # Records request duration, status
    │   │
    │   └── ratelimit.go            # Rate limiting middleware
    │       • RateLimiter()         # Token bucket rate limiting
    │
    ├── router/
    │   └── router.go               # Route definitions
    │       • NewRouter()           # Creates Chi router with routes
    │       • registerRoutes()      # Registers all route handlers
    │
    └── proxy/
        └── proxy.go                # Reverse proxy implementation
            • NewServiceProxy()     # Creates proxy for service
            • ServeHTTP()           # Proxies request to backend
            • addContextHeaders()   # Adds X-User-ID, X-Org-ID headers
```

### Middleware Stack Implementation

The middleware stack is applied in a specific order for security:

```go
// router/router.go
func NewRouter(cfg *config.Config, services *Services) chi.Router {
    r := chi.NewRouter()

    // 1. Request ID - First to enable correlation
    r.Use(middleware.RequestID)

    // 2. Security Headers - Applied to all responses
    r.Use(middleware.SecurityHeaders)

    // 3. Logger - After RequestID for correlation
    r.Use(middleware.RequestLogger(cfg.Logger))

    // 4. Recoverer - Catch panics
    r.Use(chi.Recoverer)

    // 5. Metrics - Record all requests
    r.Use(middleware.Metrics(cfg.MetricsRegistry))

    // 6. Rate Limiter - Before authentication
    r.Use(middleware.RateLimiter(cfg.RateLimitRPS))

    // Public routes (no auth required)
    r.Group(func(r chi.Router) {
        r.Get("/health", handlers.Health)
        r.Get("/health/ready", handlers.Ready)
        r.Get("/health/live", handlers.Live)
        r.Mount("/api/v1/auth", authProxy)
    })

    // Protected routes (auth required)
    r.Group(func(r chi.Router) {
        // 7. Authentication
        r.Use(middleware.Authenticate(cfg.JWTSecret))

        // 8. Workspace Authorization
        r.Use(middleware.RequireWorkspaceAccess(services.WorkspaceValidator))

        r.Mount("/api/v1/port-calls", coreProxy)
        r.Mount("/api/v1/service-orders", coreProxy)
        r.Mount("/api/v1/rfqs", coreProxy)
        r.Mount("/api/v1/vessels", vesselProxy)
        r.Mount("/api/v1/positions", vesselProxy)
        r.Mount("/api/v1/vendors", coreProxy)
        r.Mount("/api/v1/documents", coreProxy)
        r.Mount("/api/v1/notifications", notificationProxy)
        r.Mount("/api/v1/analytics", analyticsProxy)
    })

    // WebSocket upgrade (special handling)
    r.Group(func(r chi.Router) {
        r.Use(middleware.WebSocketAuth(cfg.JWTSecret))
        r.Mount("/ws", realtimeProxy)
    })

    return r
}
```

### Security Headers Implementation

```go
// middleware/security.go
func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        headers := w.Header()

        // ── Content Security ────────────────────────────────────────
        // Prevent MIME type sniffing
        headers.Set("X-Content-Type-Options", "nosniff")

        // Prevent clickjacking
        headers.Set("X-Frame-Options", "DENY")

        // Legacy XSS protection for older browsers
        headers.Set("X-XSS-Protection", "1; mode=block")

        // ── Transport Security ──────────────────────────────────────
        // Enforce HTTPS (1 year, include subdomains, preload eligible)
        if isProduction() {
            headers.Set("Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload")
        }

        // ── Content Security Policy ─────────────────────────────────
        // Strict CSP for API responses
        headers.Set("Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'")

        // ── Privacy Headers ─────────────────────────────────────────
        // Limit referrer information
        headers.Set("Referrer-Policy", "strict-origin-when-cross-origin")

        // Disable FLoC/Topics API tracking
        headers.Set("Permissions-Policy",
            "interest-cohort=(), browsing-topics=()")

        // ── Cross-Origin Isolation ──────────────────────────────────
        headers.Set("Cross-Origin-Opener-Policy", "same-origin")
        headers.Set("Cross-Origin-Resource-Policy", "same-origin")
        headers.Set("Cross-Origin-Embedder-Policy", "require-corp")

        // ── Cache Control ───────────────────────────────────────────
        // Prevent caching of API responses
        headers.Set("Cache-Control", "no-store, no-cache, must-revalidate")
        headers.Set("Pragma", "no-cache")
        headers.Set("Expires", "0")

        next.ServeHTTP(w, r)
    })
}
```

### Authentication Middleware

```go
// middleware/auth.go
func Authenticate(jwtSecret string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract token from Authorization header
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                response.Unauthorized(w, "Authorization header required")
                return
            }

            // Validate "Bearer <token>" format
            parts := strings.Split(authHeader, " ")
            if len(parts) != 2 || parts[0] != "Bearer" {
                response.Unauthorized(w, "Invalid authorization format")
                return
            }

            tokenString := parts[1]

            // Parse and validate JWT
            claims, err := auth.ValidateToken(tokenString, jwtSecret)
            if err != nil {
                switch {
                case errors.Is(err, auth.ErrTokenExpired):
                    response.Unauthorized(w, "Token expired")
                case errors.Is(err, auth.ErrInvalidToken):
                    response.Unauthorized(w, "Invalid token")
                default:
                    response.Unauthorized(w, "Authentication failed")
                }
                return
            }

            // Add claims to context
            ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)

            // Log authenticated request
            logger.Debug("Request authenticated",
                zap.String("user_id", claims.UserID),
                zap.String("organization_id", claims.OrganizationID),
                zap.String("request_id", middleware.GetRequestID(r.Context())),
            )

            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func RequireWorkspaceAccess(validator WorkspaceValidator) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := GetClaims(r.Context())
            if claims == nil {
                response.Unauthorized(w, "No authentication context")
                return
            }

            // Extract workspace ID from request
            workspaceID := extractWorkspaceID(r)
            if workspaceID == "" {
                // No workspace context required for this endpoint
                next.ServeHTTP(w, r)
                return
            }

            // Validate user has access to workspace
            hasAccess, err := validator.HasAccess(
                r.Context(),
                claims.UserID,
                claims.OrganizationID,
                workspaceID,
            )
            if err != nil {
                response.InternalError(w, "Failed to validate workspace access")
                return
            }

            if !hasAccess {
                logger.Warn("Workspace access denied",
                    zap.String("user_id", claims.UserID),
                    zap.String("workspace_id", workspaceID),
                )
                response.Forbidden(w, "Access denied to this workspace")
                return
            }

            // Add workspace to context
            ctx := context.WithValue(r.Context(), WorkspaceIDContextKey, workspaceID)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

### Rate Limiting Implementation

```go
// middleware/ratelimit.go
type RateLimiter struct {
    buckets sync.Map
    rate    float64
    burst   int
}

func NewRateLimiter(requestsPerSecond float64) *RateLimiter {
    return &RateLimiter{
        rate:  requestsPerSecond,
        burst: int(requestsPerSecond * 2), // Allow burst of 2x rate
    }
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Identify client by IP or user ID
        key := rl.getClientKey(r)

        // Get or create rate limiter for this client
        bucket := rl.getBucket(key)

        // Check if request is allowed
        if !bucket.Allow() {
            // Add rate limit headers
            w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", int(rl.rate)))
            w.Header().Set("X-RateLimit-Remaining", "0")
            w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second).Unix()))
            w.Header().Set("Retry-After", "1")

            response.RateLimited(w, "Too many requests")
            return
        }

        // Add rate limit headers to response
        remaining := bucket.Tokens()
        w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", int(rl.rate)))
        w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", int(remaining)))
        w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second).Unix()))

        next.ServeHTTP(w, r)
    })
}

func (rl *RateLimiter) getClientKey(r *http.Request) string {
    // Prefer user ID for authenticated requests
    if claims := GetClaims(r.Context()); claims != nil {
        return "user:" + claims.UserID
    }

    // Fall back to IP address
    ip := r.Header.Get("X-Forwarded-For")
    if ip == "" {
        ip = r.Header.Get("X-Real-IP")
    }
    if ip == "" {
        ip, _, _ = net.SplitHostPort(r.RemoteAddr)
    }
    return "ip:" + ip
}
```

### Request Logging

```go
// middleware/logger.go
func RequestLogger(logger *zap.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()

            // Wrap response writer to capture status code
            ww := NewWrapResponseWriter(w, r.ProtoMajor)

            // Process request
            next.ServeHTTP(ww, r)

            // Calculate duration
            duration := time.Since(start)

            // Build log fields
            fields := []zap.Field{
                zap.String("request_id", GetRequestID(r.Context())),
                zap.String("method", r.Method),
                zap.String("path", r.URL.Path),
                zap.String("query", r.URL.RawQuery),
                zap.Int("status", ww.Status()),
                zap.Int("bytes", ww.BytesWritten()),
                zap.Duration("duration", duration),
                zap.String("remote_addr", r.RemoteAddr),
                zap.String("user_agent", r.UserAgent()),
            }

            // Add user context if available
            if claims := GetClaims(r.Context()); claims != nil {
                fields = append(fields,
                    zap.String("user_id", claims.UserID),
                    zap.String("organization_id", claims.OrganizationID),
                )
            }

            // Log based on status code
            status := ww.Status()
            switch {
            case status >= 500:
                logger.Error("Request completed with error", fields...)
            case status >= 400:
                logger.Warn("Request completed with client error", fields...)
            default:
                logger.Info("Request completed", fields...)
            }
        })
    }
}
```

### Routing Configuration

| Route Pattern | Target Service | Auth Required | Description |
|---------------|----------------|---------------|-------------|
| `GET /health` | Gateway | No | Gateway health check |
| `GET /health/ready` | Gateway | No | Readiness probe |
| `GET /health/live` | Gateway | No | Liveness probe |
| `/api/v1/auth/*` | Auth Service (4001) | Partial | Authentication endpoints |
| `/api/v1/port-calls/*` | Core Service (4002) | Yes | Port call management |
| `/api/v1/service-orders/*` | Core Service (4002) | Yes | Service order management |
| `/api/v1/rfqs/*` | Core Service (4002) | Yes | RFQ management |
| `/api/v1/vendors/*` | Core Service (4002) | Yes | Vendor management |
| `/api/v1/vessels/*` | Vessel Service (4003) | Yes | Vessel registry |
| `/api/v1/positions/*` | Vessel Service (4003) | Yes | Position tracking |
| `/api/v1/notifications/*` | Notification (4005) | Yes | Notifications |
| `/api/v1/analytics/*` | Analytics (4006) | Yes | Analytics and reporting |
| `/ws/*` | Realtime (4004) | Yes (Token) | WebSocket connections |

### Environment Configuration

```bash
# Server Configuration
PORT=4000                          # Gateway listening port
GO_ENV=production                  # Environment (development/production)
LOG_LEVEL=info                     # Logging level (debug/info/warn/error)

# Security
JWT_SECRET=<32+ character secret>  # JWT signing secret (REQUIRED)
RATE_LIMIT_RPS=100                 # Requests per second per client
CORS_ALLOWED_ORIGINS=https://app.navo.io,https://portal.navo.io

# Backend Services
AUTH_SERVICE_URL=http://auth:4001
CORE_SERVICE_URL=http://core:4002
VESSEL_SERVICE_URL=http://vessel:4003
REALTIME_SERVICE_URL=http://realtime:4004
NOTIFICATION_SERVICE_URL=http://notification:4005
ANALYTICS_SERVICE_URL=http://analytics:4006

# Timeouts
PROXY_TIMEOUT=30s                  # Backend request timeout
READ_TIMEOUT=10s                   # HTTP read timeout
WRITE_TIMEOUT=30s                  # HTTP write timeout
IDLE_TIMEOUT=120s                  # Keep-alive timeout

# Observability
METRICS_PATH=/metrics              # Prometheus metrics endpoint
TRACING_ENABLED=true               # Enable distributed tracing
OTEL_EXPORTER_ENDPOINT=http://jaeger:4317
```

---

## Auth Service

**Location**: `services/auth`
**Port**: 4001
**Health Check**: `GET /health`

### Purpose

The Auth Service handles all authentication and user identity management:

- **User Registration**: Create new user accounts
- **Login/Logout**: Session management with JWT tokens
- **Password Management**: Secure password handling and reset
- **Token Lifecycle**: Access/refresh token generation and validation
- **User Profile**: Profile updates and preferences

### Detailed Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                            AUTH SERVICE                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│   │   Handler   │───▶│   Service   │───▶│ Repository  │                  │
│   └─────────────┘    └─────────────┘    └─────────────┘                  │
│          │                  │                  │                          │
│          │                  │                  │                          │
│          ▼                  ▼                  ▼                          │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│   │  Validation │    │   bcrypt    │    │ PostgreSQL  │                  │
│   │   (Input)   │    │   (Hash)    │    │  (Storage)  │                  │
│   └─────────────┘    └─────────────┘    └─────────────┘                  │
│                             │                                             │
│                             ▼                                             │
│                      ┌─────────────┐                                      │
│                      │    Redis    │                                      │
│                      │ (Sessions)  │                                      │
│                      └─────────────┘                                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
services/auth/
├── cmd/
│   └── main.go                     # Application entry point
└── internal/
    ├── config/
    │   └── config.go               # Configuration
    │       • PORT
    │       • DATABASE_URL
    │       • REDIS_URL
    │       • JWT_SECRET
    │       • JWT_ACCESS_LIFETIME
    │       • JWT_REFRESH_LIFETIME
    │       • BCRYPT_COST
    │       • MAX_LOGIN_ATTEMPTS
    │       • LOCKOUT_DURATION
    │
    ├── model/
    │   ├── user.go                 # User entity
    │   │   • User struct
    │   │   • UserRole enum
    │   │
    │   ├── session.go              # Session entity
    │   │   • Session struct
    │   │   • SessionStatus enum
    │   │
    │   └── dto.go                  # DTOs
    │       • LoginRequest
    │       • LoginResponse
    │       • TokenRefreshRequest
    │       • PasswordResetRequest
    │
    ├── repository/
    │   ├── user_repository.go      # User data access
    │   │   • FindByEmail()
    │   │   • FindByID()
    │   │   • Create()
    │   │   • Update()
    │   │   • IncrementFailedAttempts()
    │   │   • ResetFailedAttempts()
    │   │   • SetLockedUntil()
    │   │
    │   └── session_repository.go   # Session data access
    │       • Create()
    │       • FindByRefreshToken()
    │       • Revoke()
    │       • RevokeAllForUser()
    │       • CleanupExpired()
    │
    ├── service/
    │   └── auth_service.go         # Business logic
    │       • Login()
    │       • Logout()
    │       • RefreshTokens()
    │       • ForgotPassword()
    │       • ResetPassword()
    │       • ChangePassword()
    │       • UpdateProfile()
    │       • validatePassword()
    │       • generateTokens()
    │
    └── handler/
        └── auth_handler.go         # HTTP handlers
            • HandleLogin()
            • HandleLogout()
            • HandleRefresh()
            • HandleForgotPassword()
            • HandleResetPassword()
            • HandleGetMe()
            • HandleUpdateProfile()
            • HandleChangePassword()
```

### API Endpoints

#### POST /api/v1/auth/login

Authenticates a user and returns JWT tokens.

**Request:**
```json
{
  "email": "operator@example.com",
  "password": "securePassword123!"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": "usr_abc123xyz",
      "email": "operator@example.com",
      "name": "John Operator",
      "organization_id": "org_def456",
      "organization_name": "Maritime Corp",
      "role": "operator",
      "avatar_url": "https://storage.navo.io/avatars/usr_abc123xyz.jpg",
      "workspaces": [
        {
          "id": "ws_ghi789",
          "name": "Singapore Operations",
          "role": "operator"
        },
        {
          "id": "ws_jkl012",
          "name": "Rotterdam Operations",
          "role": "viewer"
        }
      ],
      "last_login_at": "2024-01-15T08:30:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1705311600
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid email or password format |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `ACCOUNT_LOCKED` | Too many failed attempts |
| 403 | `EMAIL_NOT_VERIFIED` | Email verification required |

#### POST /api/v1/auth/refresh

Refreshes an expired access token using the refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1705312500
  }
}
```

#### POST /api/v1/auth/logout

Invalidates the current session and refresh token.

**Request Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

#### POST /api/v1/auth/forgot-password

Initiates password reset flow by sending an email.

**Request:**
```json
{
  "email": "operator@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### POST /api/v1/auth/reset-password

Completes password reset using the token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword456!",
  "password_confirmation": "newSecurePassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

#### GET /api/v1/auth/me

Returns the current authenticated user's profile.

**Response (200 OK):**
```json
{
  "data": {
    "id": "usr_abc123xyz",
    "email": "operator@example.com",
    "name": "John Operator",
    "organization_id": "org_def456",
    "role": "operator",
    "avatar_url": "https://storage.navo.io/avatars/usr_abc123xyz.jpg",
    "created_at": "2023-06-15T10:00:00Z",
    "last_login_at": "2024-01-15T08:30:00Z",
    "preferences": {
      "timezone": "Asia/Singapore",
      "language": "en",
      "date_format": "DD/MM/YYYY",
      "notifications": {
        "email": true,
        "push": true
      }
    }
  }
}
```

#### PUT /api/v1/auth/profile

Updates the current user's profile.

**Request:**
```json
{
  "name": "John D. Operator",
  "avatar_url": "https://storage.navo.io/avatars/new-avatar.jpg",
  "preferences": {
    "timezone": "Europe/Rotterdam",
    "language": "en"
  }
}
```

#### PUT /api/v1/auth/password

Changes the current user's password.

**Request:**
```json
{
  "current_password": "currentPassword123!",
  "new_password": "newSecurePassword789!",
  "new_password_confirmation": "newSecurePassword789!"
}
```

### Authentication Service Implementation

```go
// service/auth_service.go
type AuthService struct {
    userRepo    *repository.UserRepository
    sessionRepo *repository.SessionRepository
    jwtSecret   []byte
    bcryptCost  int
    config      *config.Config
    audit       audit.Logger
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
    // 1. Find user by email
    user, err := s.userRepo.FindByEmail(ctx, input.Email)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            // Use constant time comparison to prevent timing attacks
            bcrypt.CompareHashAndPassword([]byte("dummy"), []byte(input.Password))
            return nil, ErrInvalidCredentials
        }
        return nil, fmt.Errorf("find user: %w", err)
    }

    // 2. Check if account is locked
    if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
        s.audit.LogAsync(ctx, audit.NewBuilder().
            WithUser(user.ID, user.OrganizationID).
            WithAction(audit.ActionLoginFailed).
            WithMetadata(map[string]any{
                "reason": "account_locked",
                "locked_until": user.LockedUntil,
            }).
            Build())
        return nil, ErrAccountLocked
    }

    // 3. Verify password
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash),
        []byte(input.Password),
    ); err != nil {
        // Increment failed attempts
        attempts, err := s.userRepo.IncrementFailedAttempts(ctx, user.ID)
        if err != nil {
            logger.Error("Failed to increment attempts", zap.Error(err))
        }

        // Lock account if too many attempts
        if attempts >= s.config.MaxLoginAttempts {
            lockUntil := time.Now().Add(s.config.LockoutDuration)
            s.userRepo.SetLockedUntil(ctx, user.ID, lockUntil)

            s.audit.LogAsync(ctx, audit.NewBuilder().
                WithUser(user.ID, user.OrganizationID).
                WithAction(audit.ActionAccountLocked).
                WithMetadata(map[string]any{
                    "failed_attempts": attempts,
                    "locked_until": lockUntil,
                }).
                Build())
        }

        s.audit.LogAsync(ctx, audit.NewBuilder().
            WithUser(user.ID, user.OrganizationID).
            WithAction(audit.ActionLoginFailed).
            WithMetadata(map[string]any{
                "reason": "invalid_password",
                "failed_attempts": attempts,
            }).
            Build())

        return nil, ErrInvalidCredentials
    }

    // 4. Reset failed attempts on successful login
    if user.FailedLoginAttempts > 0 {
        s.userRepo.ResetFailedAttempts(ctx, user.ID)
    }

    // 5. Generate tokens
    tokens, err := s.generateTokens(user)
    if err != nil {
        return nil, fmt.Errorf("generate tokens: %w", err)
    }

    // 6. Create session
    session := &model.Session{
        ID:           uuid.New().String(),
        UserID:       user.ID,
        RefreshToken: tokens.RefreshToken,
        ExpiresAt:    time.Now().Add(s.config.RefreshTokenLifetime),
        UserAgent:    input.UserAgent,
        IPAddress:    input.IPAddress,
    }
    if err := s.sessionRepo.Create(ctx, session); err != nil {
        return nil, fmt.Errorf("create session: %w", err)
    }

    // 7. Update last login
    s.userRepo.UpdateLastLogin(ctx, user.ID)

    // 8. Audit log successful login
    s.audit.LogAsync(ctx, audit.NewBuilder().
        WithUser(user.ID, user.OrganizationID).
        WithAction(audit.ActionLogin).
        WithMetadata(map[string]any{
            "ip_address": input.IPAddress,
            "user_agent": input.UserAgent,
        }).
        Build())

    return &LoginResult{
        User:         user,
        AccessToken:  tokens.AccessToken,
        RefreshToken: tokens.RefreshToken,
        ExpiresAt:    tokens.ExpiresAt,
    }, nil
}

func (s *AuthService) generateTokens(user *model.User) (*Tokens, error) {
    now := time.Now()
    accessExpiry := now.Add(s.config.AccessTokenLifetime)
    refreshExpiry := now.Add(s.config.RefreshTokenLifetime)

    // Access token claims
    accessClaims := jwt.MapClaims{
        "sub":             user.ID,
        "iss":             "navo-auth",
        "aud":             "navo-api",
        "iat":             now.Unix(),
        "exp":             accessExpiry.Unix(),
        "jti":             uuid.New().String(),
        "user_id":         user.ID,
        "organization_id": user.OrganizationID,
        "role":            user.Role,
        "token_type":      "access",
    }

    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessTokenString, err := accessToken.SignedString(s.jwtSecret)
    if err != nil {
        return nil, fmt.Errorf("sign access token: %w", err)
    }

    // Refresh token claims (minimal)
    refreshClaims := jwt.MapClaims{
        "sub":        user.ID,
        "iss":        "navo-auth",
        "iat":        now.Unix(),
        "exp":        refreshExpiry.Unix(),
        "jti":        uuid.New().String(),
        "token_type": "refresh",
    }

    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshTokenString, err := refreshToken.SignedString(s.jwtSecret)
    if err != nil {
        return nil, fmt.Errorf("sign refresh token: %w", err)
    }

    return &Tokens{
        AccessToken:  accessTokenString,
        RefreshToken: refreshTokenString,
        ExpiresAt:    accessExpiry.Unix(),
    }, nil
}
```

### Password Security Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Algorithm | bcrypt | Industry-standard password hashing |
| Cost Factor | 12 | ~250ms to hash (balance of security/performance) |
| Minimum Length | 12 characters | NIST recommendation |
| Complexity | Mixed case + numbers | Recommended but not forced |
| Max Attempts | 5 per 15 minutes | Brute force protection |
| Account Lockout | 10 failed attempts | 30 minute lockout |
| Reset Token Expiry | 1 hour | Time-limited password reset |
| Reset Token Usage | Single-use | Invalidated after use |

### Token Configuration

| Token Type | Lifetime | Storage | Contains |
|------------|----------|---------|----------|
| Access Token | 15 minutes | localStorage + cookie | User ID, Org ID, Role, Permissions |
| Refresh Token | 7 days | HttpOnly cookie + database | User ID only |

---

## Core Service

**Location**: `services/core`
**Port**: 4002
**Health Check**: `GET /health`

### Purpose

The Core Service is the central business logic service handling:

- **Port Call Management**: CRUD operations, status workflow, timeline
- **Service Orders**: Service requests for port calls
- **RFQ Management**: Request for quotations workflow
- **Vendor Management**: Vendor registry and relationships
- **Document Management**: File attachments for entities

### Detailed Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              CORE SERVICE                                     │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          HANDLER LAYER                                  │  │
│  │                                                                          │  │
│  │   PortCallHandler   ServiceOrderHandler   RFQHandler   VendorHandler    │  │
│  └────────────────────────────────┬─────────────────────────────────────────┘  │
│                                   │                                           │
│  ┌────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                          SERVICE LAYER                                   │  │
│  │                                                                          │  │
│  │   PortCallService   ServiceOrderService   RFQService   VendorService    │  │
│  │                                                                          │  │
│  │   • Business logic     • Status workflows  • Quote management           │  │
│  │   • Validation         • Vendor assignment • Vendor invitations         │  │
│  │   • Authorization      • Timeline events   • Award process              │  │
│  └────────────────────────────────┬─────────────────────────────────────────┘  │
│                                   │                                           │
│  ┌────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                        REPOSITORY LAYER                                  │  │
│  │                                                                          │  │
│  │   PortCallRepo    ServiceOrderRepo    RFQRepo    VendorRepo    ...       │  │
│  │                                                                          │  │
│  │   • Data access        • Query building   • Pagination                  │  │
│  │   • RLS enforcement    • Transactions     • Bulk operations             │  │
│  └────────────────────────────────┬─────────────────────────────────────────┘  │
│                                   │                                           │
│                                   ▼                                           │
│                          ┌─────────────────┐                                  │
│                          │   PostgreSQL    │                                  │
│                          │   (with RLS)    │                                  │
│                          └─────────────────┘                                  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
services/core/
├── cmd/
│   └── main.go
└── internal/
    ├── config/
    │   └── config.go
    │
    ├── model/
    │   ├── portcall.go             # Port call entity
    │   │   • PortCall struct
    │   │   • PortCallStatus enum (draft/planned/confirmed/arrived/alongside/departed/completed/cancelled)
    │   │   • TimelineEvent struct
    │   │
    │   ├── serviceorder.go         # Service order entity
    │   │   • ServiceOrder struct
    │   │   • ServiceOrderStatus enum
    │   │   • ServiceType struct
    │   │
    │   ├── rfq.go                  # RFQ entity
    │   │   • RFQ struct
    │   │   • RFQStatus enum
    │   │   • Quote struct
    │   │   • RFQInvitation struct
    │   │
    │   ├── vendor.go               # Vendor entity
    │   │   • Vendor struct
    │   │   • VendorType enum
    │   │   • VendorStatus enum
    │   │
    │   └── document.go             # Document entity
    │
    ├── repository/
    │   ├── base.go                 # Base repository with RLS setup
    │   ├── portcall.go
    │   ├── serviceorder.go
    │   ├── rfq.go
    │   ├── vendor.go
    │   └── document.go
    │
    ├── service/
    │   ├── portcall.go
    │   ├── serviceorder.go
    │   ├── rfq.go
    │   ├── vendor.go
    │   └── document.go
    │
    ├── handler/
    │   ├── portcall.go
    │   ├── serviceorder.go
    │   ├── rfq.go
    │   ├── vendor.go
    │   └── document.go
    │
    └── middleware/
        ├── context.go              # User context extraction
        └── rls.go                  # Row-level security setup
```

### Port Call Management

#### Port Call Entity

```go
// model/portcall.go
type PortCall struct {
    ID              string          `json:"id"`
    Reference       string          `json:"reference"`
    OrganizationID  string          `json:"organization_id"`
    WorkspaceID     string          `json:"workspace_id"`
    VesselID        string          `json:"vessel_id"`
    PortID          string          `json:"port_id"`
    Status          PortCallStatus  `json:"status"`

    // Timestamps
    ETA             *time.Time      `json:"eta"`
    ETD             *time.Time      `json:"etd"`
    ATA             *time.Time      `json:"ata"`
    ATD             *time.Time      `json:"atd"`

    // Berth Information
    BerthName       string          `json:"berth_name"`
    BerthTerminal   string          `json:"berth_terminal"`
    BerthConfirmed  bool            `json:"berth_confirmed"`

    // Assignments
    AgentID         *string         `json:"agent_id"`

    // Cargo
    CargoType       string          `json:"cargo_type"`
    CargoQuantity   *float64        `json:"cargo_quantity"`
    CargoUnit       string          `json:"cargo_unit"`

    // Metadata
    Purpose         string          `json:"purpose"`
    Notes           string          `json:"notes"`
    Metadata        json.RawMessage `json:"metadata"`

    // Audit
    CreatedBy       string          `json:"created_by"`
    CreatedAt       time.Time       `json:"created_at"`
    UpdatedAt       time.Time       `json:"updated_at"`

    // Relationships (loaded on demand)
    Vessel          *Vessel         `json:"vessel,omitempty"`
    Port            *Port           `json:"port,omitempty"`
    Agent           *Vendor         `json:"agent,omitempty"`
    Services        []ServiceOrder  `json:"services,omitempty"`
    Timeline        []TimelineEvent `json:"timeline,omitempty"`
}

type PortCallStatus string

const (
    PortCallStatusDraft     PortCallStatus = "draft"
    PortCallStatusPlanned   PortCallStatus = "planned"
    PortCallStatusConfirmed PortCallStatus = "confirmed"
    PortCallStatusArrived   PortCallStatus = "arrived"
    PortCallStatusAlongside PortCallStatus = "alongside"
    PortCallStatusDeparted  PortCallStatus = "departed"
    PortCallStatusCompleted PortCallStatus = "completed"
    PortCallStatusCancelled PortCallStatus = "cancelled"
)
```

#### Status Workflow

```
                         Status Transition Rules
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   ┌─────────┐                                                              │
│   │  draft  │  ───────────────────────────────┐                            │
│   └────┬────┘                                 │                            │
│        │                                      │                            │
│        │ [All required fields provided]       │                            │
│        ▼                                      │                            │
│   ┌─────────┐                                 │                            │
│   │ planned │  ◄────────────────────┐         │  [Cancel at any           │
│   └────┬────┘                       │         │   pre-completed state]    │
│        │                            │         │                            │
│        │ [Berth + Agent confirmed]  │         ▼                            │
│        ▼                            │    ┌──────────┐                      │
│   ┌───────────┐                     │    │cancelled │                      │
│   │ confirmed │                     │    └──────────┘                      │
│   └─────┬─────┘                     │                                      │
│         │                           │                                      │
│         │ [Vessel AIS arrives]      │                                      │
│         ▼                           │                                      │
│   ┌─────────┐                       │                                      │
│   │ arrived │                       │                                      │
│   └────┬────┘                       │                                      │
│        │                            │                                      │
│        │ [Vessel at berth]          │                                      │
│        ▼                            │                                      │
│   ┌───────────┐                     │                                      │
│   │ alongside │                     │                                      │
│   └─────┬─────┘                     │                                      │
│         │                           │                                      │
│         │ [Vessel leaves berth]     │ [Revert - any ops issue]            │
│         ▼                           │                                      │
│   ┌──────────┐                      │                                      │
│   │ departed │  ────────────────────┘                                      │
│   └────┬─────┘                                                             │
│        │                                                                   │
│        │ [All services completed, documents finalized]                     │
│        ▼                                                                   │
│   ┌───────────┐                                                            │
│   │ completed │  ← FINAL STATE (immutable)                                 │
│   └───────────┘                                                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Port Call Service Implementation

```go
// service/portcall.go
type PortCallService struct {
    repo        *repository.PortCallRepository
    vesselRepo  *repository.VesselRepository
    portRepo    *repository.PortRepository
    timeline    *TimelineService
    realtime    *realtime.Client
    audit       audit.Logger
}

func (s *PortCallService) Create(ctx context.Context, input CreatePortCallInput) (*model.PortCall, error) {
    // 1. Validate input
    if err := s.validateCreate(ctx, input); err != nil {
        return nil, fmt.Errorf("validation: %w", err)
    }

    // 2. Generate reference
    reference, err := s.generateReference(ctx, input.WorkspaceID)
    if err != nil {
        return nil, fmt.Errorf("generate reference: %w", err)
    }

    // 3. Create port call
    portCall := &model.PortCall{
        ID:             uuid.New().String(),
        Reference:      reference,
        OrganizationID: input.OrganizationID,
        WorkspaceID:    input.WorkspaceID,
        VesselID:       input.VesselID,
        PortID:         input.PortID,
        Status:         model.PortCallStatusDraft,
        ETA:            input.ETA,
        ETD:            input.ETD,
        BerthName:      input.BerthName,
        BerthTerminal:  input.BerthTerminal,
        CargoType:      input.CargoType,
        CargoQuantity:  input.CargoQuantity,
        CargoUnit:      input.CargoUnit,
        Purpose:        input.Purpose,
        Notes:          input.Notes,
        CreatedBy:      input.CreatedBy,
        CreatedAt:      time.Now(),
        UpdatedAt:      time.Now(),
    }

    // 4. Save to database
    if err := s.repo.Create(ctx, portCall); err != nil {
        return nil, fmt.Errorf("create port call: %w", err)
    }

    // 5. Add timeline event
    s.timeline.AddEvent(ctx, portCall.ID, model.TimelineEvent{
        EventType:   "created",
        Description: "Port call created",
        UserID:      input.CreatedBy,
        Timestamp:   time.Now(),
    })

    // 6. Publish real-time event
    s.realtime.Publish(ctx, realtime.Event{
        Topic: fmt.Sprintf("workspace:%s:port_calls", input.WorkspaceID),
        Type:  "port_call:created",
        Data:  portCall,
    })

    // 7. Audit log
    s.audit.LogAsync(ctx, audit.NewBuilder().
        WithUser(input.CreatedBy, input.OrganizationID).
        WithWorkspace(input.WorkspaceID).
        WithAction(audit.ActionCreate).
        WithEntity(audit.EntityPortCall, portCall.ID).
        WithNewValue(portCall).
        Build())

    return portCall, nil
}

func (s *PortCallService) UpdateStatus(ctx context.Context, id string, newStatus model.PortCallStatus, userID string) error {
    // 1. Get current port call
    portCall, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return fmt.Errorf("get port call: %w", err)
    }

    // 2. Validate transition
    if !s.isValidTransition(portCall.Status, newStatus) {
        return &ValidationError{
            Field:   "status",
            Message: fmt.Sprintf("Invalid transition from %s to %s", portCall.Status, newStatus),
        }
    }

    // 3. Apply status-specific rules
    switch newStatus {
    case model.PortCallStatusConfirmed:
        if !portCall.BerthConfirmed {
            return &ValidationError{Field: "berth", Message: "Berth must be confirmed"}
        }
        if portCall.AgentID == nil {
            return &ValidationError{Field: "agent", Message: "Agent must be assigned"}
        }
    case model.PortCallStatusArrived:
        portCall.ATA = timePtr(time.Now())
    case model.PortCallStatusDeparted:
        portCall.ATD = timePtr(time.Now())
    case model.PortCallStatusCompleted:
        if !s.allServicesCompleted(ctx, id) {
            return &ValidationError{Field: "services", Message: "All services must be completed"}
        }
    }

    oldStatus := portCall.Status
    portCall.Status = newStatus
    portCall.UpdatedAt = time.Now()

    // 4. Update database
    if err := s.repo.Update(ctx, portCall); err != nil {
        return fmt.Errorf("update port call: %w", err)
    }

    // 5. Add timeline event
    s.timeline.AddEvent(ctx, id, model.TimelineEvent{
        EventType:   "status_changed",
        Description: fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
        UserID:      userID,
        Timestamp:   time.Now(),
        Metadata: map[string]any{
            "old_status": oldStatus,
            "new_status": newStatus,
        },
    })

    // 6. Publish real-time event
    s.realtime.Publish(ctx, realtime.Event{
        Topic: fmt.Sprintf("workspace:%s:port_calls", portCall.WorkspaceID),
        Type:  "port_call:status_changed",
        Data: map[string]any{
            "id":         id,
            "old_status": oldStatus,
            "new_status": newStatus,
        },
    })

    // 7. Audit log
    s.audit.LogAsync(ctx, audit.NewBuilder().
        WithUser(userID, portCall.OrganizationID).
        WithWorkspace(portCall.WorkspaceID).
        WithAction(audit.ActionStatusChange).
        WithEntity(audit.EntityPortCall, id).
        WithOldValue(map[string]any{"status": oldStatus}).
        WithNewValue(map[string]any{"status": newStatus}).
        Build())

    return nil
}

var statusTransitions = map[model.PortCallStatus][]model.PortCallStatus{
    model.PortCallStatusDraft:     {model.PortCallStatusPlanned, model.PortCallStatusCancelled},
    model.PortCallStatusPlanned:   {model.PortCallStatusConfirmed, model.PortCallStatusCancelled},
    model.PortCallStatusConfirmed: {model.PortCallStatusArrived, model.PortCallStatusPlanned, model.PortCallStatusCancelled},
    model.PortCallStatusArrived:   {model.PortCallStatusAlongside, model.PortCallStatusConfirmed, model.PortCallStatusCancelled},
    model.PortCallStatusAlongside: {model.PortCallStatusDeparted, model.PortCallStatusArrived, model.PortCallStatusCancelled},
    model.PortCallStatusDeparted:  {model.PortCallStatusCompleted, model.PortCallStatusAlongside},
    model.PortCallStatusCompleted: {}, // Final state
    model.PortCallStatusCancelled: {model.PortCallStatusDraft}, // Can reactivate
}

func (s *PortCallService) isValidTransition(from, to model.PortCallStatus) bool {
    allowed, ok := statusTransitions[from]
    if !ok {
        return false
    }
    for _, status := range allowed {
        if status == to {
            return true
        }
    }
    return false
}
```

### Service Order Management

```go
// model/serviceorder.go
type ServiceOrder struct {
    ID              string              `json:"id"`
    OrganizationID  string              `json:"organization_id"`
    WorkspaceID     string              `json:"workspace_id"`
    PortCallID      string              `json:"port_call_id"`
    ServiceTypeID   string              `json:"service_type_id"`
    VendorID        *string             `json:"vendor_id"`
    Status          ServiceOrderStatus  `json:"status"`

    Description     string              `json:"description"`
    Quantity        *float64            `json:"quantity"`
    Unit            string              `json:"unit"`

    // Pricing
    QuotedPrice     *float64            `json:"quoted_price"`
    FinalPrice      *float64            `json:"final_price"`
    Currency        string              `json:"currency"`

    // Scheduling
    RequestedDate   *time.Time          `json:"requested_date"`
    ScheduledDate   *time.Time          `json:"scheduled_date"`
    CompletedDate   *time.Time          `json:"completed_date"`

    Notes           string              `json:"notes"`
    Metadata        json.RawMessage     `json:"metadata"`

    CreatedBy       string              `json:"created_by"`
    CreatedAt       time.Time           `json:"created_at"`
    UpdatedAt       time.Time           `json:"updated_at"`
}

type ServiceOrderStatus string

const (
    ServiceOrderStatusDraft       ServiceOrderStatus = "draft"
    ServiceOrderStatusRequested   ServiceOrderStatus = "requested"
    ServiceOrderStatusRFQSent     ServiceOrderStatus = "rfq_sent"
    ServiceOrderStatusQuoted      ServiceOrderStatus = "quoted"
    ServiceOrderStatusConfirmed   ServiceOrderStatus = "confirmed"
    ServiceOrderStatusInProgress  ServiceOrderStatus = "in_progress"
    ServiceOrderStatusCompleted   ServiceOrderStatus = "completed"
    ServiceOrderStatusCancelled   ServiceOrderStatus = "cancelled"
)
```

### RFQ Management

```go
// model/rfq.go
type RFQ struct {
    ID              string          `json:"id"`
    OrganizationID  string          `json:"organization_id"`
    WorkspaceID     string          `json:"workspace_id"`
    ServiceOrderID  *string         `json:"service_order_id"`
    PortCallID      *string         `json:"port_call_id"`

    Title           string          `json:"title"`
    Description     string          `json:"description"`
    Status          RFQStatus       `json:"status"`
    Deadline        time.Time       `json:"deadline"`

    Requirements    json.RawMessage `json:"requirements"`
    Attachments     []string        `json:"attachments"`

    // Award
    AwardedVendorID *string         `json:"awarded_vendor_id"`
    AwardedQuoteID  *string         `json:"awarded_quote_id"`
    AwardedAt       *time.Time      `json:"awarded_at"`

    CreatedBy       string          `json:"created_by"`
    CreatedAt       time.Time       `json:"created_at"`
    UpdatedAt       time.Time       `json:"updated_at"`

    // Relationships
    Invitations     []RFQInvitation `json:"invitations,omitempty"`
    Quotes          []Quote         `json:"quotes,omitempty"`
}

type Quote struct {
    ID          string          `json:"id"`
    RFQID       string          `json:"rfq_id"`
    VendorID    string          `json:"vendor_id"`

    Price       float64         `json:"price"`
    Currency    string          `json:"currency"`
    ValidUntil  time.Time       `json:"valid_until"`

    LineItems   json.RawMessage `json:"line_items"`
    Terms       string          `json:"terms"`
    Notes       string          `json:"notes"`
    Attachments []string        `json:"attachments"`

    Status      QuoteStatus     `json:"status"`
    SubmittedAt time.Time       `json:"submitted_at"`
}
```

### Row-Level Security Implementation

```go
// middleware/rls.go
func SetTenantContext(pool *pgxpool.Pool) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx := r.Context()

            orgID := GetOrganizationID(ctx)
            wsID := GetWorkspaceID(ctx)

            if orgID == "" {
                response.Unauthorized(w, "Organization context required")
                return
            }

            // Set PostgreSQL session variables for RLS
            conn, err := pool.Acquire(ctx)
            if err != nil {
                response.InternalError(w, "Database connection failed")
                return
            }
            defer conn.Release()

            // Set organization context
            _, err = conn.Exec(ctx,
                "SELECT set_config('app.current_organization_id', $1, true)",
                orgID,
            )
            if err != nil {
                response.InternalError(w, "Failed to set tenant context")
                return
            }

            // Set workspace context if provided
            if wsID != "" {
                _, err = conn.Exec(ctx,
                    "SELECT set_config('app.current_workspace_id', $1, true)",
                    wsID,
                )
                if err != nil {
                    response.InternalError(w, "Failed to set workspace context")
                    return
                }
            }

            // Store connection in context for reuse
            ctx = context.WithValue(ctx, DBConnKey, conn)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

---

## Vessel Service

**Location**: `services/vessel`
**Port**: 4003
**Health Check**: `GET /health`

### Purpose

The Vessel Service manages the vessel registry and real-time position tracking:

- **Vessel Registry**: CRUD operations for vessel data
- **AIS Integration**: Multiple provider support (MarineTraffic, VesselFinder)
- **Position Tracking**: Real-time and historical positions
- **Position Caching**: Redis caching for current positions
- **Position Broadcasting**: Real-time updates via pub/sub

### Detailed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VESSEL SERVICE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         API HANDLERS                                  │  │
│  │   VesselHandler                    PositionHandler                    │  │
│  │   • List/Get/Create/Update         • GetCurrent                       │  │
│  │   • Search by IMO/MMSI             • GetHistory                       │  │
│  │   • Bulk import                    • GetFleetPositions                │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────────┐  │
│  │                        SERVICE LAYER                                   │  │
│  │                                                                         │  │
│  │   VesselService                   TrackingService                       │  │
│  │   • CRUD operations                • Position updates                   │  │
│  │   • IMO/MMSI validation            • AIS provider abstraction          │  │
│  │   • Fleet management               • Position caching                  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│         ┌───────────────────────────┼───────────────────────────┐           │
│         │                           │                           │           │
│         ▼                           ▼                           ▼           │
│  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐      │
│  │ PostgreSQL  │            │    Redis    │            │AIS Providers│      │
│  │  (Storage)  │            │   (Cache)   │            │ (External)  │      │
│  └─────────────┘            └─────────────┘            └─────────────┘      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                       BACKGROUND WORKER                                 │  │
│  │                                                                         │  │
│  │   PositionUpdater                                                       │  │
│  │   • Scheduled polling (every 5 min)                                     │  │
│  │   • Batch AIS queries                                                   │  │
│  │   • Store positions → Cache → Publish                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AIS Integration

```go
// integration/ais.go
type AISProvider interface {
    // GetPosition returns current position for a single vessel
    GetPosition(ctx context.Context, imo string) (*Position, error)

    // GetPositions returns current positions for multiple vessels
    GetPositions(ctx context.Context, imos []string) ([]Position, error)

    // GetHistoricalTrack returns position history
    GetHistoricalTrack(ctx context.Context, imo string, from, to time.Time) ([]Position, error)

    // GetVesselDetails returns enhanced vessel information
    GetVesselDetails(ctx context.Context, imo string) (*VesselDetails, error)

    // HealthCheck verifies provider connectivity
    HealthCheck(ctx context.Context) error
}

type Position struct {
    VesselIMO   string    `json:"vessel_imo"`
    Latitude    float64   `json:"latitude"`
    Longitude   float64   `json:"longitude"`
    Course      float64   `json:"course"`       // Course over ground (degrees)
    Speed       float64   `json:"speed"`        // Speed over ground (knots)
    Heading     float64   `json:"heading"`      // True heading (degrees)
    Status      string    `json:"status"`       // Navigation status
    Destination string    `json:"destination"`  // AIS destination
    ETA         time.Time `json:"eta"`          // AIS ETA
    ReceivedAt  time.Time `json:"received_at"`
    Source      string    `json:"source"`       // Provider name
}
```

### MarineTraffic Adapter

```go
// integration/marinetraffic.go
type MarineTrafficProvider struct {
    apiKey     string
    baseURL    string
    httpClient *http.Client
    cache      *redis.Client
    logger     *zap.Logger
}

func NewMarineTrafficProvider(cfg *config.AISConfig, cache *redis.Client, logger *zap.Logger) *MarineTrafficProvider {
    return &MarineTrafficProvider{
        apiKey:  cfg.MarineTrafficAPIKey,
        baseURL: "https://services.marinetraffic.com/api",
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     90 * time.Second,
            },
        },
        cache:  cache,
        logger: logger,
    }
}

func (p *MarineTrafficProvider) GetPositions(ctx context.Context, imos []string) ([]Position, error) {
    if len(imos) == 0 {
        return nil, nil
    }

    // Check cache first
    positions := make([]Position, 0, len(imos))
    uncached := make([]string, 0)

    for _, imo := range imos {
        cacheKey := fmt.Sprintf("position:%s", imo)
        if data, err := p.cache.Get(ctx, cacheKey).Bytes(); err == nil {
            var pos Position
            if json.Unmarshal(data, &pos) == nil {
                positions = append(positions, pos)
                continue
            }
        }
        uncached = append(uncached, imo)
    }

    if len(uncached) == 0 {
        return positions, nil
    }

    // Query MarineTraffic API for uncached positions
    // Use PS06 endpoint for fleet positions
    url := fmt.Sprintf("%s/exportvessels/%s/v:8/timespan:10/protocol:jsono",
        p.baseURL, p.apiKey)

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    resp, err := p.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("api request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("api error: status %d", resp.StatusCode)
    }

    var apiResp []mtPosition
    if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
        return nil, fmt.Errorf("decode response: %w", err)
    }

    // Filter and convert to our Position type
    imoSet := make(map[string]bool)
    for _, imo := range uncached {
        imoSet[imo] = true
    }

    for _, mt := range apiResp {
        if !imoSet[mt.IMO] {
            continue
        }

        pos := Position{
            VesselIMO:   mt.IMO,
            Latitude:    mt.LAT,
            Longitude:   mt.LON,
            Course:      mt.COURSE,
            Speed:       mt.SPEED,
            Heading:     mt.HEADING,
            Status:      mt.STATUS,
            Destination: mt.DESTINATION,
            ReceivedAt:  time.Now(),
            Source:      "marinetraffic",
        }

        positions = append(positions, pos)

        // Cache the position
        data, _ := json.Marshal(pos)
        p.cache.Set(ctx, fmt.Sprintf("position:%s", mt.IMO), data, 10*time.Minute)
    }

    return positions, nil
}
```

### Position Update Worker

```go
// worker/position_updater.go
type PositionUpdater struct {
    vesselRepo   *repository.VesselRepository
    positionRepo *repository.PositionRepository
    aisProvider  AISProvider
    cache        *redis.Client
    pubsub       *redis.Client
    logger       *zap.Logger
    interval     time.Duration
    batchSize    int
}

func (u *PositionUpdater) Start(ctx context.Context) {
    ticker := time.NewTicker(u.interval)
    defer ticker.Stop()

    // Run immediately on start
    u.updatePositions(ctx)

    for {
        select {
        case <-ctx.Done():
            u.logger.Info("Position updater stopped")
            return
        case <-ticker.C:
            u.updatePositions(ctx)
        }
    }
}

func (u *PositionUpdater) updatePositions(ctx context.Context) {
    start := time.Now()

    // Get all tracked vessels
    vessels, err := u.vesselRepo.GetTrackedVessels(ctx)
    if err != nil {
        u.logger.Error("Failed to get tracked vessels", zap.Error(err))
        return
    }

    if len(vessels) == 0 {
        return
    }

    // Extract IMOs
    imos := make([]string, len(vessels))
    for i, v := range vessels {
        imos[i] = v.IMO
    }

    // Process in batches
    var allPositions []Position
    for i := 0; i < len(imos); i += u.batchSize {
        end := i + u.batchSize
        if end > len(imos) {
            end = len(imos)
        }
        batch := imos[i:end]

        positions, err := u.aisProvider.GetPositions(ctx, batch)
        if err != nil {
            u.logger.Error("Failed to get positions",
                zap.Int("batch_start", i),
                zap.Error(err),
            )
            continue
        }

        allPositions = append(allPositions, positions...)
    }

    // Store positions
    for _, pos := range allPositions {
        // 1. Store in database
        dbPos := &model.VesselPosition{
            ID:         uuid.New().String(),
            VesselID:   u.vesselRepo.GetIDByIMO(ctx, pos.VesselIMO),
            Latitude:   pos.Latitude,
            Longitude:  pos.Longitude,
            Course:     pos.Course,
            Speed:      pos.Speed,
            Heading:    pos.Heading,
            Status:     pos.Status,
            Destination: pos.Destination,
            ReceivedAt: pos.ReceivedAt,
            Source:     pos.Source,
        }
        u.positionRepo.Create(ctx, dbPos)

        // 2. Update cache (current position)
        cacheKey := fmt.Sprintf("vessel:position:current:%s", dbPos.VesselID)
        data, _ := json.Marshal(pos)
        u.cache.Set(ctx, cacheKey, data, 15*time.Minute)

        // 3. Publish to real-time subscribers
        u.pubsub.Publish(ctx, fmt.Sprintf("vessel:%s:position", dbPos.VesselID), data)
    }

    u.logger.Info("Position update completed",
        zap.Int("vessels", len(vessels)),
        zap.Int("positions", len(allPositions)),
        zap.Duration("duration", time.Since(start)),
    )
}
```

---

## Realtime Service

**Location**: `services/realtime`
**Port**: 4004
**Health Check**: `GET /health`

### Purpose

The Realtime Service provides WebSocket connections for real-time updates:

- **WebSocket Server**: Persistent connections with clients
- **Topic Subscriptions**: Clients subscribe to specific topics
- **Event Broadcasting**: Distributes events from backend services
- **Connection Management**: Authentication, heartbeat, reconnection

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REALTIME SERVICE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         CLIENT CONNECTIONS                          │   │
│   │                                                                      │   │
│   │   Client 1        Client 2        Client 3        Client N          │   │
│   │   (ws://...)      (ws://...)      (ws://...)      (ws://...)        │   │
│   └────────┬─────────────┬─────────────┬─────────────┬──────────────────┘   │
│            │             │             │             │                      │
│            └─────────────┴──────┬──────┴─────────────┘                      │
│                                 │                                           │
│   ┌─────────────────────────────▼───────────────────────────────────────┐   │
│   │                            HUB                                       │   │
│   │                                                                      │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐     │   │
│   │   │ Connections │    │ Subscribers │    │  Message Broadcast  │     │   │
│   │   │    Map      │    │    Map      │    │       Channel       │     │   │
│   │   └─────────────┘    └─────────────┘    └─────────────────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│   ┌─────────────────────────────▼───────────────────────────────────────┐   │
│   │                     SUBSCRIPTION MANAGER                             │   │
│   │                                                                      │   │
│   │   Topics:                                                            │   │
│   │   • workspace:{id}:port_calls                                        │   │
│   │   • workspace:{id}:services                                          │   │
│   │   • vessel:{id}:position                                             │   │
│   │   • user:{id}:notifications                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                 ▲                                           │
│                                 │                                           │
│   ┌─────────────────────────────┴───────────────────────────────────────┐   │
│   │                       REDIS PUB/SUB                                  │   │
│   │              (Receives events from other services)                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WebSocket Protocol

```typescript
// Client → Server messages
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  topics?: string[];          // For subscribe/unsubscribe
  message_id?: string;        // Optional correlation ID
}

// Server → Client messages
interface ServerMessage {
  type: 'event' | 'subscribed' | 'unsubscribed' | 'pong' | 'error';
  topic?: string;             // For event messages
  event?: string;             // Event type (e.g., 'port_call:updated')
  data?: any;                 // Event payload
  message_id?: string;        // Correlation ID if provided
  error?: {
    code: string;
    message: string;
  };
}
```

### Hub Implementation

```go
// hub/hub.go
type Hub struct {
    // Registered clients
    clients    map[*Client]bool
    clientsMu  sync.RWMutex

    // Topic → Clients mapping
    subscriptions map[string]map[*Client]bool
    subsMu        sync.RWMutex

    // Channels
    register   chan *Client
    unregister chan *Client
    broadcast  chan *Message

    logger *zap.Logger
}

type Client struct {
    hub       *Hub
    conn      *websocket.Conn
    send      chan []byte
    userID    string
    orgID     string
    topics    map[string]bool
    topicsMu  sync.RWMutex
}

type Message struct {
    Topic string
    Event string
    Data  json.RawMessage
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.clientsMu.Lock()
            h.clients[client] = true
            h.clientsMu.Unlock()
            h.logger.Debug("Client connected",
                zap.String("user_id", client.userID),
            )

        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                h.removeClient(client)
                h.logger.Debug("Client disconnected",
                    zap.String("user_id", client.userID),
                )
            }

        case message := <-h.broadcast:
            h.broadcastToTopic(message)
        }
    }
}

func (h *Hub) Subscribe(client *Client, topics []string) error {
    h.subsMu.Lock()
    defer h.subsMu.Unlock()

    for _, topic := range topics {
        // Validate topic access
        if !h.canSubscribe(client, topic) {
            return fmt.Errorf("access denied to topic: %s", topic)
        }

        if h.subscriptions[topic] == nil {
            h.subscriptions[topic] = make(map[*Client]bool)
        }
        h.subscriptions[topic][client] = true

        client.topicsMu.Lock()
        client.topics[topic] = true
        client.topicsMu.Unlock()
    }

    return nil
}

func (h *Hub) broadcastToTopic(msg *Message) {
    h.subsMu.RLock()
    clients := h.subscriptions[msg.Topic]
    h.subsMu.RUnlock()

    if len(clients) == 0 {
        return
    }

    payload, err := json.Marshal(map[string]any{
        "type":  "event",
        "topic": msg.Topic,
        "event": msg.Event,
        "data":  msg.Data,
    })
    if err != nil {
        h.logger.Error("Failed to marshal message", zap.Error(err))
        return
    }

    for client := range clients {
        select {
        case client.send <- payload:
        default:
            // Client buffer full, close connection
            h.removeClient(client)
        }
    }
}
```

---

## Notification Service

**Location**: `services/notification`
**Port**: 4005
**Health Check**: `GET /health`

### Purpose

Handles all notification delivery across channels:

- **Email Notifications**: Transactional emails via SMTP
- **Push Notifications**: Browser/mobile push (future)
- **In-App Notifications**: Stored notifications with read status
- **Notification Preferences**: Per-user channel preferences

### Email Templates

| Template | Trigger | Variables |
|----------|---------|-----------|
| `welcome.html` | User registration | `name`, `org_name`, `login_url` |
| `password_reset.html` | Forgot password | `name`, `reset_link`, `expires_at` |
| `port_call_created.html` | Port call created | `port_call`, `vessel`, `port`, `eta` |
| `port_call_status.html` | Status change | `port_call`, `old_status`, `new_status` |
| `service_assigned.html` | Vendor assigned | `service_order`, `vendor`, `scheduled_date` |
| `rfq_invitation.html` | RFQ invite | `rfq`, `deadline`, `requirements` |
| `rfq_quote_received.html` | Quote submitted | `rfq`, `quote`, `vendor` |
| `rfq_awarded.html` | RFQ awarded | `rfq`, `vendor`, `amount` |
| `daily_digest.html` | Daily summary | `upcoming_calls`, `pending_services`, `open_rfqs` |

---

## Analytics Service

**Location**: `services/analytics`
**Port**: 4006
**Health Check**: `GET /health`

### Metrics and KPIs

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `port_calls_by_status` | Count per status | `GROUP BY status` |
| `port_calls_by_port` | Distribution | `GROUP BY port_id` |
| `average_port_stay` | Average duration | `AVG(atd - ata)` |
| `services_by_category` | Service breakdown | `GROUP BY service_type.category` |
| `vendor_performance` | Completion rate | `completed / total` |
| `rfq_response_rate` | Quote response | `quotes / invitations` |
| `average_rfq_savings` | Cost savings | `AVG(budget - awarded_price)` |

---

## Worker Service

**Location**: `services/worker`
**Health Check**: `GET /health`

### Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `position_sync` | Every 5 min | Sync vessel positions from AIS |
| `eta_notification` | Every hour | Send ETA reminders |
| `rfq_deadline` | Every 15 min | Check approaching RFQ deadlines |
| `notification_cleanup` | Daily 2 AM | Remove 90-day old notifications |
| `audit_archival` | Weekly Sunday | Archive old audit logs |
| `report_generation` | On demand | Generate scheduled reports |
| `data_export` | On demand | Export customer data |

---

## Shared Packages

### pkg/auth

JWT token handling and validation.

```go
// Claims represents JWT token claims
type Claims struct {
    jwt.RegisteredClaims
    UserID         string   `json:"user_id"`
    OrganizationID string   `json:"organization_id"`
    WorkspaceID    string   `json:"workspace_id,omitempty"`
    Role           string   `json:"role"`
    Permissions    []string `json:"permissions,omitempty"`
    TokenType      string   `json:"token_type"`
}

// ValidateToken parses and validates a JWT token
func ValidateToken(tokenString, secret string) (*Claims, error)

// GenerateToken creates a new JWT token
func GenerateToken(claims *Claims, secret string, expiry time.Duration) (string, error)

// HasPermission checks if claims include a permission
func HasPermission(claims *Claims, permission string) bool
```

### pkg/database

PostgreSQL connection pooling with pgx.

```go
// NewPool creates a new connection pool with RLS support
func NewPool(cfg *Config) (*pgxpool.Pool, error)

// Config holds database configuration
type Config struct {
    Host        string
    Port        int
    User        string
    Password    string
    Database    string
    SSLMode     string
    MaxConns    int
    MinConns    int
    MaxConnLife time.Duration
}
```

### pkg/audit

Audit logging system.

```go
// Logger interface for audit logging
type Logger interface {
    Log(ctx context.Context, event *Event) error
    LogAsync(ctx context.Context, event *Event)
}

// Event represents an audit log entry
type Event struct {
    ID             string
    Timestamp      time.Time
    UserID         string
    OrganizationID string
    WorkspaceID    string
    Action         Action
    EntityType     EntityType
    EntityID       string
    OldValue       json.RawMessage
    NewValue       json.RawMessage
    Metadata       map[string]any
    IPAddress      string
    UserAgent      string
    RequestID      string
    Status         string
    ErrorMessage   string
}

// Builder for creating audit events fluently
type Builder struct {
    event *Event
}

func NewBuilder() *Builder
func (b *Builder) WithUser(userID, orgID string) *Builder
func (b *Builder) WithWorkspace(wsID string) *Builder
func (b *Builder) WithAction(action Action) *Builder
func (b *Builder) WithEntity(entityType EntityType, entityID string) *Builder
func (b *Builder) WithOldValue(v any) *Builder
func (b *Builder) WithNewValue(v any) *Builder
func (b *Builder) WithMetadata(m map[string]any) *Builder
func (b *Builder) WithRequestContext(ctx context.Context) *Builder
func (b *Builder) Build() *Event
```

### pkg/features

Feature flag system.

```go
// Service interface for feature flags
type Service interface {
    IsEnabled(ctx context.Context, key string, orgID, wsID string) bool
    GetAll(ctx context.Context, orgID, wsID string) map[string]bool
}

// Default flags
const (
    FlagRFQEnabled           = "rfq_enabled"
    FlagVesselTracking       = "vessel_tracking_enabled"
    FlagAutomation           = "automation_enabled"
    FlagAnalytics            = "analytics_enabled"
    FlagDocumentSharing      = "document_sharing_enabled"
    FlagAdvancedReporting    = "advanced_reporting_enabled"
)
```

### pkg/response

Standardized HTTP response helpers.

```go
// Success responses
func JSON(w http.ResponseWriter, status int, data any)
func Created(w http.ResponseWriter, data any)
func NoContent(w http.ResponseWriter)

// Error responses
func BadRequest(w http.ResponseWriter, message string)
func Unauthorized(w http.ResponseWriter, message string)
func Forbidden(w http.ResponseWriter, message string)
func NotFound(w http.ResponseWriter, message string)
func Conflict(w http.ResponseWriter, message string)
func RateLimited(w http.ResponseWriter, message string)
func InternalError(w http.ResponseWriter, message string)

// Structured error
func Error(w http.ResponseWriter, status int, code, message string, details any)
```

---

## Service Communication Patterns

### Synchronous (HTTP)

Used for request/response operations where the caller needs an immediate response.

```
Client → Gateway → Service → Response
```

Examples:
- GET /api/v1/port-calls → Core Service
- POST /api/v1/auth/login → Auth Service
- GET /api/v1/vessels/:id/position → Vessel Service

### Asynchronous (Redis Pub/Sub)

Used for event broadcasting where services don't need to wait for completion.

```
Service → Redis Pub/Sub → Realtime Service → WebSocket Clients
                       → Other Services (optional)
```

Examples:
- Port call status change → Notify connected clients
- New position data → Update fleet map
- RFQ quote received → Notify operators

### Event Flow Example

```
┌───────────┐    HTTP     ┌───────────┐    Publish    ┌───────────┐
│  Client   │ ─────────▶  │   Core    │ ───────────▶  │   Redis   │
│  (API)    │             │  Service  │               │  Pub/Sub  │
└───────────┘             └───────────┘               └─────┬─────┘
                                                            │
                               ┌────────────────────────────┘
                               │
                               ▼
                         ┌───────────┐     WebSocket    ┌───────────┐
                         │ Realtime  │ ───────────────▶ │  Clients  │
                         │  Service  │                  │  (UI)     │
                         └───────────┘                  └───────────┘
```

---

## Error Handling Standards

### Error Response Format

All services use consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Description | When to Use |
|------|-------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input | Missing/invalid fields |
| `INVALID_CREDENTIALS` | 401 | Auth failed | Wrong password |
| `TOKEN_EXPIRED` | 401 | Token expired | Expired JWT |
| `UNAUTHORIZED` | 401 | Not authenticated | Missing token |
| `FORBIDDEN` | 403 | Not authorized | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found | Entity doesn't exist |
| `CONFLICT` | 409 | Resource conflict | Duplicate entry |
| `RATE_LIMITED` | 429 | Too many requests | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error | Unexpected failure |

---

## Monitoring and Observability

### Metrics (Prometheus)

Each service exposes metrics at `/metrics`:

```
# Request metrics
http_requests_total{method="GET",path="/api/v1/port-calls",status="200"}
http_request_duration_seconds{method="GET",path="/api/v1/port-calls",quantile="0.99"}

# Database metrics
db_pool_connections_total
db_pool_connections_idle
db_query_duration_seconds

# Business metrics
port_calls_created_total{workspace="..."}
service_orders_by_status{status="completed"}
rfq_response_time_seconds
```

### Logging (Structured JSON)

```json
{
  "level": "info",
  "ts": 1704067200.123,
  "caller": "handler/portcall.go:45",
  "msg": "Port call created",
  "request_id": "req_abc123",
  "user_id": "usr_xyz789",
  "organization_id": "org_def456",
  "port_call_id": "pc_ghi012",
  "duration_ms": 45
}
```

### Distributed Tracing (OpenTelemetry)

Traces flow through services with correlation:

```
Gateway (trace_id: abc123)
  └── Auth Service (span: validate_token)
  └── Core Service (span: get_port_call)
      └── PostgreSQL (span: db.query)
      └── Redis (span: cache.get)
```

---

## Deployment Configuration

### Kubernetes Resources

```yaml
# Example: Core Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-service
  labels:
    app: core
spec:
  replicas: 3
  selector:
    matchLabels:
      app: core
  template:
    metadata:
      labels:
        app: core
    spec:
      containers:
      - name: core
        image: navo/core:latest
        ports:
        - containerPort: 4002
        env:
        - name: PORT
          value: "4002"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: navo-secrets
              key: DATABASE_URL
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 4002
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 4002
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Resource Guidelines

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
|---------|-------------|-----------|----------------|--------------|----------|
| Gateway | 100m | 500m | 128Mi | 512Mi | 3+ |
| Auth | 100m | 500m | 128Mi | 512Mi | 2+ |
| Core | 200m | 1000m | 256Mi | 1Gi | 3+ |
| Vessel | 100m | 500m | 256Mi | 1Gi | 2+ |
| Realtime | 100m | 500m | 256Mi | 512Mi | 2+ |
| Notification | 50m | 200m | 128Mi | 256Mi | 2 |
| Analytics | 200m | 1000m | 512Mi | 2Gi | 2 |
| Worker | 100m | 500m | 256Mi | 1Gi | 2 |
