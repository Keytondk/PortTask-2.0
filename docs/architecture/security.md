# Navo Security Architecture

This document provides comprehensive documentation of the security architecture, controls, implementation details, and best practices for the Navo Maritime Operations Platform.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Security Principles](#security-principles)
3. [Authentication](#authentication)
4. [Authorization](#authorization)
5. [Multi-Tenancy & Data Isolation](#multi-tenancy--data-isolation)
6. [Transport Security](#transport-security)
7. [Data Protection](#data-protection)
8. [Audit Logging](#audit-logging)
9. [Security Headers](#security-headers)
10. [Rate Limiting](#rate-limiting)
11. [Input Validation](#input-validation)
12. [Secret Management](#secret-management)
13. [Vulnerability Management](#vulnerability-management)
14. [Incident Response](#incident-response)
15. [Compliance](#compliance)
16. [Security Checklist](#security-checklist)

---

## Security Overview

### Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                         PERIMETER SECURITY                                  │   │
│   │   • WAF (Web Application Firewall)                                          │   │
│   │   • DDoS Protection (CloudFlare/AWS Shield)                                 │   │
│   │   • TLS 1.2+ Termination                                                    │   │
│   │   • Rate Limiting (Edge)                                                    │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│   ┌──────────────────────────────────────▼──────────────────────────────────────┐   │
│   │                         APPLICATION SECURITY                                │   │
│   │                                                                              │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │   │
│   │   │   Security   │   │     JWT      │   │    Rate      │                    │   │
│   │   │   Headers    │   │  Validation  │   │   Limiting   │                    │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘                    │   │
│   │                                                                              │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │   │
│   │   │   RBAC       │   │  Workspace   │   │    Input     │                    │   │
│   │   │   Checks     │   │   Access     │   │  Validation  │                    │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘                    │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│   ┌──────────────────────────────────────▼──────────────────────────────────────┐   │
│   │                          DATA SECURITY                                       │   │
│   │                                                                              │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │   │
│   │   │  Row-Level   │   │  Encryption  │   │    Audit     │                    │   │
│   │   │  Security    │   │   At Rest    │   │   Logging    │                    │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘                    │   │
│   │                                                                              │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │   │
│   │   │  Encrypted   │   │   Backup     │   │   Secrets    │                    │   │
│   │   │  Connections │   │  Encryption  │   │  Management  │                    │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘                    │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Security Layers

| Layer | Controls | Implementation |
|-------|----------|----------------|
| **Perimeter** | WAF, DDoS, TLS | CloudFlare / AWS Shield |
| **Network** | VPC, Security Groups, mTLS | AWS VPC / Kubernetes Network Policies |
| **Application** | Auth, Authz, Validation | Gateway middleware |
| **Data** | RLS, Encryption, Audit | PostgreSQL, S3 |
| **Operational** | Monitoring, Alerting, IR | Prometheus, PagerDuty |

---

## Security Principles

### 1. Defense in Depth

Multiple layers of security controls protect against various attack vectors. If one layer fails, others provide protection.

```
                       ┌─────────────────────────────┐
                       │        Edge Protection       │
                       │    (WAF, DDoS, Geo-block)    │
                       ├─────────────────────────────┤
                       │      Transport Security      │
                       │     (TLS 1.2+, HSTS)        │
                       ├─────────────────────────────┤
                       │     API Gateway Security     │
                       │  (Rate Limit, Auth, Headers) │
                       ├─────────────────────────────┤
                       │    Application Security      │
                       │   (RBAC, Validation, CSP)    │
                       ├─────────────────────────────┤
                       │       Data Security          │
                       │  (RLS, Encryption, Audit)    │
                       └─────────────────────────────┘
```

### 2. Least Privilege

Users, services, and processes are granted only the minimum permissions necessary to perform their functions.

**Implementation:**
- Role-based access control with granular permissions
- Service accounts with scoped database access
- API tokens with limited scopes
- Network policies restricting pod communication

### 3. Secure by Default

Security controls are enabled by default. Insecure options require explicit configuration.

**Examples:**
- PostgreSQL SSL defaults to `require` in production
- JWT_SECRET panics on startup if not configured
- Security headers applied to all responses
- CORS disabled by default

### 4. Zero Trust

All requests are authenticated and authorized, regardless of network location. No implicit trust based on network boundaries.

```
Every Request:
  1. Validate JWT token
  2. Check token expiration
  3. Verify user exists and is active
  4. Check organization access
  5. Verify workspace membership
  6. Validate permission for action
```

### 5. Fail Secure

The system fails in a secure state. Errors don't expose sensitive data or bypass security controls.

**Implementation:**
- Default deny on authorization failures
- Generic error messages to clients
- Detailed errors logged server-side only
- Service isolation on failure

---

## Authentication

### JWT-Based Authentication

The platform uses JSON Web Tokens (JWT) for stateless authentication with a dual-token pattern.

#### Token Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌───────┐                    ┌───────┐                    ┌───────────┐      │
│   │Client │                    │Gateway│                    │Auth Service│     │
│   └───┬───┘                    └───┬───┘                    └─────┬─────┘      │
│       │                            │                              │            │
│       │  1. POST /auth/login       │                              │            │
│       │  {email, password}         │                              │            │
│       │ ─────────────────────────► │                              │            │
│       │                            │  2. Forward request          │            │
│       │                            │ ────────────────────────────►│            │
│       │                            │                              │            │
│       │                            │                 3. Validate credentials   │
│       │                            │                    Hash password          │
│       │                            │                    Check lockout          │
│       │                            │                    Generate tokens        │
│       │                            │                              │            │
│       │                            │  4. {access_token,           │            │
│       │                            │      refresh_token}          │            │
│       │  5. Store tokens           │◄────────────────────────────│            │
│       │◄──────────────────────────│                              │            │
│       │                            │                              │            │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                              SUBSEQUENT REQUESTS                                │
│                                                                                 │
│       │  6. GET /api/v1/...        │                              │            │
│       │  Authorization: Bearer xxx │                              │            │
│       │ ─────────────────────────► │                              │            │
│       │                            │                              │            │
│       │                 7. Validate JWT locally                   │            │
│       │                    Check expiration                       │            │
│       │                    Extract claims                         │            │
│       │                            │                              │            │
│       │  8. Response               │                              │            │
│       │◄──────────────────────────│                              │            │
│       │                            │                              │            │
└───────┴────────────────────────────┴──────────────────────────────┴────────────┘
```

#### Token Structure

**Access Token Claims:**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "usr_abc123xyz",
    "iss": "navo-auth",
    "aud": "navo-api",
    "exp": 1704067200,
    "iat": 1704066300,
    "nbf": 1704066300,
    "jti": "tok_xyz789def",

    "user_id": "usr_abc123xyz",
    "email": "user@example.com",
    "organization_id": "org_def456",
    "organization_name": "Maritime Corp",
    "role": "operator",
    "permissions": [
      "port_calls:read",
      "port_calls:write",
      "services:read",
      "services:write",
      "vessels:read"
    ],
    "workspaces": ["ws_ghi789", "ws_jkl012"],
    "token_type": "access"
  }
}
```

**Refresh Token Claims:**

```json
{
  "payload": {
    "sub": "usr_abc123xyz",
    "iss": "navo-auth",
    "exp": 1704672000,
    "iat": 1704066300,
    "jti": "ref_abc123",
    "token_type": "refresh"
  }
}
```

#### Token Configuration

| Token Type | Lifetime | Storage Location | Revocation |
|------------|----------|------------------|------------|
| Access Token | 15 minutes | localStorage + httpOnly cookie | Not stored server-side |
| Refresh Token | 7 days | httpOnly cookie + database | Database deletion |

#### JWT Implementation

**Location:** `pkg/auth/jwt.go`

```go
package auth

import (
    "errors"
    "os"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

var (
    ErrTokenExpired   = errors.New("token has expired")
    ErrTokenInvalid   = errors.New("token is invalid")
    ErrTokenMalformed = errors.New("token is malformed")
    ErrInvalidIssuer  = errors.New("invalid token issuer")
)

var jwtSecret []byte

func init() {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        panic("JWT_SECRET environment variable is required")
    }
    if len(secret) < 32 {
        panic("JWT_SECRET must be at least 32 characters")
    }
    jwtSecret = []byte(secret)
}

// Claims represents the JWT token claims
type Claims struct {
    jwt.RegisteredClaims

    // User identification
    UserID         string   `json:"user_id"`
    Email          string   `json:"email"`

    // Organization context
    OrganizationID string   `json:"organization_id"`
    OrgName        string   `json:"organization_name,omitempty"`

    // Access control
    Role           string   `json:"role"`
    Permissions    []string `json:"permissions,omitempty"`
    Workspaces     []string `json:"workspaces,omitempty"`

    // Token metadata
    TokenType      string   `json:"token_type"`
}

// ValidateToken parses and validates a JWT token string
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // Validate signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrTokenInvalid
        }
        return jwtSecret, nil
    })

    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return nil, ErrTokenExpired
        }
        if errors.Is(err, jwt.ErrTokenMalformed) {
            return nil, ErrTokenMalformed
        }
        return nil, ErrTokenInvalid
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, ErrTokenInvalid
    }

    // Validate issuer
    if claims.Issuer != "navo-auth" {
        return nil, ErrInvalidIssuer
    }

    // Validate audience
    if !claims.VerifyAudience("navo-api", true) {
        return nil, ErrTokenInvalid
    }

    return claims, nil
}

// GenerateAccessToken creates a new access token
func GenerateAccessToken(user *User, ttl time.Duration) (string, error) {
    now := time.Now()

    claims := &Claims{
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   user.ID,
            Issuer:    "navo-auth",
            Audience:  jwt.ClaimStrings{"navo-api"},
            ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
            IssuedAt:  jwt.NewNumericDate(now),
            NotBefore: jwt.NewNumericDate(now),
            ID:        generateJTI(),
        },
        UserID:         user.ID,
        Email:          user.Email,
        OrganizationID: user.OrganizationID,
        OrgName:        user.OrganizationName,
        Role:           user.Role,
        Permissions:    user.Permissions,
        Workspaces:     user.WorkspaceIDs,
        TokenType:      "access",
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// HasPermission checks if the claims include a specific permission
func HasPermission(claims *Claims, permission string) bool {
    // Admin role has all permissions
    if claims.Role == "admin" {
        return true
    }

    for _, p := range claims.Permissions {
        if p == permission || p == "*" {
            return true
        }
        // Check wildcard patterns (e.g., "port_calls:*")
        if matchWildcard(p, permission) {
            return true
        }
    }
    return false
}

// HasWorkspaceAccess checks if user has access to a workspace
func HasWorkspaceAccess(claims *Claims, workspaceID string) bool {
    for _, ws := range claims.Workspaces {
        if ws == workspaceID || ws == "*" {
            return true
        }
    }
    return false
}
```

### Password Security

**Location:** `services/auth/internal/service/auth.go`

#### Password Requirements

| Requirement | Value | Rationale |
|-------------|-------|-----------|
| Minimum length | 12 characters | NIST SP 800-63B recommendation |
| Maximum length | 128 characters | Prevent DoS via long passwords |
| Complexity | Recommended (not enforced) | NIST guidance: length > complexity |
| Common password check | Enabled | Prevents top 10,000 common passwords |
| Breach check | Optional (HaveIBeenPwned) | Prevents known compromised passwords |

#### Password Hashing

```go
package auth

import (
    "golang.org/x/crypto/bcrypt"
)

const (
    // bcryptCost of 12 provides ~250ms hashing time
    // Good balance between security and performance
    bcryptCost = 12
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
    if err != nil {
        return "", err
    }
    return string(bytes), nil
}

// VerifyPassword compares a password to a hash
// Uses constant-time comparison to prevent timing attacks
func VerifyPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

// ValidatePasswordStrength checks password requirements
func ValidatePasswordStrength(password string) error {
    if len(password) < 12 {
        return errors.New("password must be at least 12 characters")
    }
    if len(password) > 128 {
        return errors.New("password must not exceed 128 characters")
    }
    if isCommonPassword(password) {
        return errors.New("password is too common")
    }
    return nil
}
```

### Brute Force Protection

```go
// Login attempt tracking and lockout
type LoginAttemptTracker struct {
    store  redis.Client
    config struct {
        MaxAttempts     int           // 5
        LockoutDuration time.Duration // 30 minutes
        WindowDuration  time.Duration // 15 minutes
    }
}

func (t *LoginAttemptTracker) RecordFailedAttempt(ctx context.Context, email string) (int, error) {
    key := fmt.Sprintf("login_attempts:%s", email)

    // Increment attempt count
    attempts, err := t.store.Incr(ctx, key).Result()
    if err != nil {
        return 0, err
    }

    // Set expiration on first attempt
    if attempts == 1 {
        t.store.Expire(ctx, key, t.config.WindowDuration)
    }

    // Check if should lock
    if int(attempts) >= t.config.MaxAttempts {
        lockKey := fmt.Sprintf("login_lockout:%s", email)
        t.store.Set(ctx, lockKey, "locked", t.config.LockoutDuration)
    }

    return int(attempts), nil
}

func (t *LoginAttemptTracker) IsLockedOut(ctx context.Context, email string) (bool, time.Duration) {
    lockKey := fmt.Sprintf("login_lockout:%s", email)
    ttl, err := t.store.TTL(ctx, lockKey).Result()
    if err != nil || ttl <= 0 {
        return false, 0
    }
    return true, ttl
}

func (t *LoginAttemptTracker) ClearAttempts(ctx context.Context, email string) error {
    key := fmt.Sprintf("login_attempts:%s", email)
    return t.store.Del(ctx, key).Err()
}
```

### Session Management

```go
// Session represents an active user session
type Session struct {
    ID           string    `json:"id"`
    UserID       string    `json:"user_id"`
    RefreshToken string    `json:"-"` // Never exposed
    TokenHash    string    `json:"token_hash"` // SHA-256 of refresh token

    // Device information
    UserAgent    string    `json:"user_agent"`
    IPAddress    string    `json:"ip_address"`
    DeviceID     string    `json:"device_id,omitempty"`

    // Timestamps
    CreatedAt    time.Time `json:"created_at"`
    LastUsedAt   time.Time `json:"last_used_at"`
    ExpiresAt    time.Time `json:"expires_at"`

    // Status
    IsRevoked    bool      `json:"is_revoked"`
    RevokedAt    *time.Time `json:"revoked_at,omitempty"`
    RevokedReason string   `json:"revoked_reason,omitempty"`
}

// Session repository operations
type SessionRepository interface {
    // Create a new session
    Create(ctx context.Context, session *Session) error

    // Find by token hash
    FindByTokenHash(ctx context.Context, hash string) (*Session, error)

    // Update last used timestamp
    UpdateLastUsed(ctx context.Context, id string) error

    // Revoke a specific session
    Revoke(ctx context.Context, id string, reason string) error

    // Revoke all sessions for a user
    RevokeAllForUser(ctx context.Context, userID string, reason string) error

    // List active sessions for a user
    ListActiveByUser(ctx context.Context, userID string) ([]*Session, error)

    // Cleanup expired sessions
    CleanupExpired(ctx context.Context) (int, error)
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ROLE HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                              ADMIN                                      │   │
│   │   Full access to all features and settings within organization          │   │
│   │   Can manage users, roles, and organization settings                    │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│   ┌─────────────────────────────────▼───────────────────────────────────────┐   │
│   │                             MANAGER                                     │   │
│   │   Can manage operations, assign vendors, approve RFQs                   │   │
│   │   Cannot manage users or organization settings                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│   ┌─────────────────────────────────▼───────────────────────────────────────┐   │
│   │                            OPERATOR                                     │   │
│   │   Day-to-day operations: create/edit port calls, services               │   │
│   │   Cannot delete or manage vendors                                       │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│   ┌─────────────────────────────────▼───────────────────────────────────────┐   │
│   │                             VIEWER                                      │   │
│   │   Read-only access to data                                              │   │
│   │   Can view but not modify anything                                      │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Permission Matrix

| Resource | Permission | admin | manager | operator | viewer |
|----------|------------|:-----:|:-------:|:--------:|:------:|
| **Port Calls** | read | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | - |
| | update | ✓ | ✓ | ✓ | - |
| | delete | ✓ | ✓ | - | - |
| | change_status | ✓ | ✓ | ✓ | - |
| **Service Orders** | read | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | - |
| | update | ✓ | ✓ | ✓ | - |
| | delete | ✓ | ✓ | - | - |
| | assign_vendor | ✓ | ✓ | - | - |
| **RFQs** | read | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | - |
| | update | ✓ | ✓ | ✓ | - |
| | publish | ✓ | ✓ | - | - |
| | award | ✓ | ✓ | - | - |
| **Vessels** | read | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ | - |
| | update | ✓ | ✓ | ✓ | - |
| | delete | ✓ | ✓ | - | - |
| **Vendors** | read | ✓ | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | - | - |
| | update | ✓ | ✓ | - | - |
| | delete | ✓ | - | - | - |
| **Users** | read | ✓ | - | - | - |
| | create | ✓ | - | - | - |
| | update | ✓ | - | - | - |
| | delete | ✓ | - | - | - |
| **Settings** | read | ✓ | - | - | - |
| | update | ✓ | - | - | - |

#### Authorization Middleware

**Location:** `services/gateway/internal/middleware/auth.go`

```go
// RequirePermission middleware checks if user has a specific permission
func RequirePermission(permission string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := GetClaims(r.Context())
            if claims == nil {
                response.Unauthorized(w, "Authentication required")
                return
            }

            // Check permission
            if !auth.HasPermission(claims, permission) {
                logger.Warn("Permission denied",
                    zap.String("user_id", claims.UserID),
                    zap.String("permission", permission),
                    zap.String("role", claims.Role),
                    zap.String("path", r.URL.Path),
                )
                response.Forbidden(w, "Insufficient permissions")
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// RequireRole middleware checks if user has one of the specified roles
func RequireRole(roles ...string) func(http.Handler) http.Handler {
    roleSet := make(map[string]bool)
    for _, role := range roles {
        roleSet[role] = true
    }

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := GetClaims(r.Context())
            if claims == nil {
                response.Unauthorized(w, "Authentication required")
                return
            }

            if !roleSet[claims.Role] {
                response.Forbidden(w, "Role not authorized for this action")
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// RequireWorkspaceAccess validates user has access to the workspace in the request
func RequireWorkspaceAccess(validator WorkspaceValidator) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := GetClaims(r.Context())
            if claims == nil {
                response.Unauthorized(w, "Authentication required")
                return
            }

            // Extract workspace ID from request
            workspaceID := extractWorkspaceID(r)
            if workspaceID == "" {
                // No workspace context required
                next.ServeHTTP(w, r)
                return
            }

            // Validate access
            hasAccess, err := validator.HasAccess(
                r.Context(),
                claims.UserID,
                claims.OrganizationID,
                workspaceID,
            )
            if err != nil {
                logger.Error("Workspace access check failed",
                    zap.Error(err),
                    zap.String("user_id", claims.UserID),
                    zap.String("workspace_id", workspaceID),
                )
                response.InternalError(w, "Failed to validate access")
                return
            }

            if !hasAccess {
                logger.Warn("Workspace access denied",
                    zap.String("user_id", claims.UserID),
                    zap.String("organization_id", claims.OrganizationID),
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

---

## Multi-Tenancy & Data Isolation

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TENANT HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Organization (Tenant) ─────────────────────────────────────────────────────   │
│   │                                                                             │
│   │   The top-level tenant boundary. All data is scoped by organization_id.    │
│   │   Complete isolation between organizations.                                 │
│   │                                                                             │
│   ├── Workspace A                                                               │
│   │   │   Logical grouping within organization (e.g., Singapore Ops)           │
│   │   │                                                                         │
│   │   ├── Users (operators, managers)                                           │
│   │   ├── Port Calls                                                            │
│   │   ├── Service Orders                                                        │
│   │   ├── Vessels                                                               │
│   │   └── Documents                                                             │
│   │                                                                             │
│   ├── Workspace B                                                               │
│   │   │   Another logical grouping (e.g., Rotterdam Ops)                       │
│   │   │                                                                         │
│   │   ├── Users (different or overlapping)                                      │
│   │   ├── Port Calls                                                            │
│   │   └── ...                                                                   │
│   │                                                                             │
│   └── Shared Resources                                                          │
│       │   Organization-wide resources                                           │
│       │                                                                         │
│       ├── Users (can access multiple workspaces)                                │
│       ├── Vendors (organization-wide)                                           │
│       └── Settings                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Row-Level Security (RLS)

RLS is enforced at the database level to ensure complete data isolation between tenants.

**Migration:** `packages/db/migrations/001_add_rls_policies.sql`

```sql
-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE port_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (ensures admins can't bypass)
ALTER TABLE port_calls FORCE ROW LEVEL SECURITY;
ALTER TABLE service_orders FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATION ISOLATION POLICIES
-- ============================================================================

-- Port Calls: Users can only see port calls in their organization
CREATE POLICY port_calls_org_isolation ON port_calls
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- With workspace filtering when workspace context is set
CREATE POLICY port_calls_workspace_filter ON port_calls
    FOR ALL
    USING (
        current_setting('app.current_workspace_id', true) IS NULL
        OR workspace_id = current_setting('app.current_workspace_id')::uuid
    );

-- Service Orders: Same pattern
CREATE POLICY service_orders_org_isolation ON service_orders
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY service_orders_workspace_filter ON service_orders
    FOR ALL
    USING (
        current_setting('app.current_workspace_id', true) IS NULL
        OR workspace_id = current_setting('app.current_workspace_id')::uuid
    );

-- RFQs
CREATE POLICY rfqs_org_isolation ON rfqs
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Vessels
CREATE POLICY vessels_org_isolation ON vessels
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Documents
CREATE POLICY documents_org_isolation ON documents
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Vendors
CREATE POLICY vendors_org_isolation ON vendors
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- ============================================================================
-- SERVICE ACCOUNT POLICIES
-- ============================================================================

-- Allow service accounts to bypass RLS for internal operations
CREATE POLICY service_account_bypass ON port_calls
    FOR ALL
    TO navo_service
    USING (true);

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Audit logs are insert-only for applications
CREATE POLICY audit_logs_insert_only ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for application users
CREATE POLICY audit_logs_no_modify ON audit_logs
    FOR SELECT
    USING (
        -- Only admin role can read audit logs
        current_setting('app.current_role', true) = 'admin'
        AND organization_id = current_setting('app.current_organization_id')::uuid
    );
```

### Tenant Context Propagation

**Location:** `services/core/internal/middleware/context.go`

```go
package middleware

import (
    "context"
    "net/http"
)

type contextKey string

const (
    UserIDKey         contextKey = "user_id"
    OrganizationIDKey contextKey = "organization_id"
    WorkspaceIDKey    contextKey = "workspace_id"
    RoleKey           contextKey = "role"
    RequestIDKey      contextKey = "request_id"
)

// ExtractUserContext extracts user context from gateway headers
func ExtractUserContext(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        // Headers are set by the gateway after JWT validation
        headers := map[contextKey]string{
            UserIDKey:         r.Header.Get("X-User-ID"),
            OrganizationIDKey: r.Header.Get("X-Organization-ID"),
            WorkspaceIDKey:    r.Header.Get("X-Workspace-ID"),
            RoleKey:           r.Header.Get("X-User-Role"),
            RequestIDKey:      r.Header.Get("X-Request-ID"),
        }

        for key, value := range headers {
            if value != "" {
                ctx = context.WithValue(ctx, key, value)
            }
        }

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// GetUserID returns the user ID from context
func GetUserID(ctx context.Context) string {
    if v := ctx.Value(UserIDKey); v != nil {
        return v.(string)
    }
    return ""
}

// GetOrganizationID returns the organization ID from context
func GetOrganizationID(ctx context.Context) string {
    if v := ctx.Value(OrganizationIDKey); v != nil {
        return v.(string)
    }
    return ""
}

// GetWorkspaceID returns the workspace ID from context
func GetWorkspaceID(ctx context.Context) string {
    if v := ctx.Value(WorkspaceIDKey); v != nil {
        return v.(string)
    }
    return ""
}

// GetRole returns the user role from context
func GetRole(ctx context.Context) string {
    if v := ctx.Value(RoleKey); v != nil {
        return v.(string)
    }
    return ""
}
```

### Database Session Configuration

```go
// SetTenantContext configures PostgreSQL session for RLS
func (r *BaseRepository) SetTenantContext(ctx context.Context) error {
    orgID := middleware.GetOrganizationID(ctx)
    wsID := middleware.GetWorkspaceID(ctx)
    role := middleware.GetRole(ctx)

    if orgID == "" {
        return errors.New("organization context required")
    }

    // Start transaction to ensure session settings apply
    tx, err := r.pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("begin transaction: %w", err)
    }

    // Set organization context (required)
    if _, err := tx.Exec(ctx,
        "SELECT set_config('app.current_organization_id', $1, true)",
        orgID,
    ); err != nil {
        tx.Rollback(ctx)
        return fmt.Errorf("set organization context: %w", err)
    }

    // Set workspace context (optional)
    if wsID != "" {
        if _, err := tx.Exec(ctx,
            "SELECT set_config('app.current_workspace_id', $1, true)",
            wsID,
        ); err != nil {
            tx.Rollback(ctx)
            return fmt.Errorf("set workspace context: %w", err)
        }
    }

    // Set role context for permission checks
    if role != "" {
        if _, err := tx.Exec(ctx,
            "SELECT set_config('app.current_role', $1, true)",
            role,
        ); err != nil {
            tx.Rollback(ctx)
            return fmt.Errorf("set role context: %w", err)
        }
    }

    // Store transaction in context for query execution
    return nil
}
```

---

## Transport Security

### TLS Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Minimum Version | TLS 1.2 | TLS 1.0/1.1 disabled |
| Preferred Version | TLS 1.3 | Used when supported |
| Certificate Type | RSA 2048-bit or ECDSA P-256 | Let's Encrypt or internal CA |
| Cipher Suites | TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384 | Strong ciphers only |
| HSTS | 1 year with preload | Enforces HTTPS |

### PostgreSQL SSL Configuration

**Location:** `pkg/database/postgres.go`

```go
func NewPool(cfg *Config) (*pgxpool.Pool, error) {
    // Determine SSL mode
    sslMode := os.Getenv("DB_SSL_MODE")
    if sslMode == "" {
        // Default to require in production
        if os.Getenv("GO_ENV") == "production" {
            sslMode = "require"
        } else {
            sslMode = "prefer"
        }
    }

    // Validate SSL mode
    validModes := map[string]bool{
        "disable": true, "allow": true, "prefer": true,
        "require": true, "verify-ca": true, "verify-full": true,
    }
    if !validModes[sslMode] {
        return nil, fmt.Errorf("invalid SSL mode: %s", sslMode)
    }

    // Warn if SSL disabled in production
    if sslMode == "disable" && os.Getenv("GO_ENV") == "production" {
        logger.Warn("PostgreSQL SSL is DISABLED in production - this is insecure!")
    }

    // Build connection string
    connString := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, sslMode,
    )

    // Add SSL certificate paths if provided
    if sslMode == "verify-ca" || sslMode == "verify-full" {
        if cfg.SSLRootCert != "" {
            connString += fmt.Sprintf(" sslrootcert=%s", cfg.SSLRootCert)
        }
        if cfg.SSLCert != "" {
            connString += fmt.Sprintf(" sslcert=%s", cfg.SSLCert)
        }
        if cfg.SSLKey != "" {
            connString += fmt.Sprintf(" sslkey=%s", cfg.SSLKey)
        }
    }

    // Parse config
    poolConfig, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, fmt.Errorf("parse connection string: %w", err)
    }

    // Configure pool
    poolConfig.MaxConns = int32(cfg.MaxConns)
    poolConfig.MinConns = int32(cfg.MinConns)
    poolConfig.MaxConnLifetime = cfg.MaxConnLifetime
    poolConfig.MaxConnIdleTime = cfg.MaxConnIdleTime
    poolConfig.HealthCheckPeriod = cfg.HealthCheckPeriod

    return pgxpool.NewWithConfig(ctx, poolConfig)
}
```

### mTLS for Service-to-Service Communication

```go
// Configure mTLS for internal service communication
func NewMTLSClient(certFile, keyFile, caFile string) (*http.Client, error) {
    // Load client certificate
    cert, err := tls.LoadX509KeyPair(certFile, keyFile)
    if err != nil {
        return nil, fmt.Errorf("load client cert: %w", err)
    }

    // Load CA certificate
    caCert, err := os.ReadFile(caFile)
    if err != nil {
        return nil, fmt.Errorf("read CA cert: %w", err)
    }

    caCertPool := x509.NewCertPool()
    if !caCertPool.AppendCertsFromPEM(caCert) {
        return nil, errors.New("failed to append CA cert")
    }

    tlsConfig := &tls.Config{
        Certificates: []tls.Certificate{cert},
        RootCAs:      caCertPool,
        MinVersion:   tls.VersionTLS12,
    }

    transport := &http.Transport{
        TLSClientConfig: tlsConfig,
    }

    return &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }, nil
}
```

---

## Data Protection

### Encryption at Rest

| Data Type | Encryption Method | Key Management |
|-----------|-------------------|----------------|
| Database | PostgreSQL TDE or AWS RDS encryption | AWS KMS |
| Document Storage | S3 SSE-S3 (AES-256) | AWS managed |
| Backups | AES-256-GCM | Separate backup keys |
| Redis Cache | At-rest encryption | Managed Redis feature |

### Encryption in Transit

| Connection | Protocol | Notes |
|------------|----------|-------|
| Client → Gateway | TLS 1.2+ | External HTTPS |
| Gateway → Services | mTLS | Internal service mesh |
| Services → PostgreSQL | TLS | SSL mode require/verify |
| Services → Redis | TLS | Encrypted connections |
| Services → S3 | HTTPS | AWS SDK defaults |

### Sensitive Data Handling

```go
// Never log or return in responses:
type User struct {
    ID           string `json:"id"`
    Email        string `json:"email"`
    Name         string `json:"name"`
    PasswordHash string `json:"-"` // Never serialized
    // ...
}

// Mask sensitive data in logs
func (u *User) LogValue() slog.Value {
    return slog.GroupValue(
        slog.String("id", u.ID),
        slog.String("email", maskEmail(u.Email)),
        // password_hash never logged
    )
}

func maskEmail(email string) string {
    parts := strings.Split(email, "@")
    if len(parts) != 2 {
        return "***"
    }
    if len(parts[0]) <= 2 {
        return "**@" + parts[1]
    }
    return parts[0][:2] + "***@" + parts[1]
}
```

---

## Audit Logging

### Audit Log Implementation

**Location:** `pkg/audit/audit.go`

```go
package audit

import (
    "context"
    "encoding/json"
    "time"
)

// Action types
type Action string

const (
    ActionCreate       Action = "create"
    ActionRead         Action = "read"
    ActionUpdate       Action = "update"
    ActionDelete       Action = "delete"
    ActionLogin        Action = "login"
    ActionLogout       Action = "logout"
    ActionLoginFailed  Action = "login_failed"
    ActionPasswordChange Action = "password_change"
    ActionStatusChange Action = "status_change"
    ActionExport       Action = "export"
    ActionShare        Action = "share"
)

// EntityType types
type EntityType string

const (
    EntityUser        EntityType = "user"
    EntityPortCall    EntityType = "port_call"
    EntityServiceOrder EntityType = "service_order"
    EntityRFQ         EntityType = "rfq"
    EntityVessel      EntityType = "vessel"
    EntityVendor      EntityType = "vendor"
    EntityDocument    EntityType = "document"
    EntitySession     EntityType = "session"
)

// Event represents an audit log entry
type Event struct {
    ID             string          `json:"id"`
    Timestamp      time.Time       `json:"timestamp"`

    // Actor
    UserID         string          `json:"user_id"`
    UserEmail      string          `json:"user_email,omitempty"`

    // Context
    OrganizationID string          `json:"organization_id"`
    WorkspaceID    string          `json:"workspace_id,omitempty"`

    // Action
    Action         Action          `json:"action"`
    EntityType     EntityType      `json:"entity_type"`
    EntityID       string          `json:"entity_id"`

    // Data
    OldValue       json.RawMessage `json:"old_value,omitempty"`
    NewValue       json.RawMessage `json:"new_value,omitempty"`
    Metadata       map[string]any  `json:"metadata,omitempty"`

    // Request context
    IPAddress      string          `json:"ip_address,omitempty"`
    UserAgent      string          `json:"user_agent,omitempty"`
    RequestID      string          `json:"request_id,omitempty"`

    // Status
    Status         string          `json:"status"`
    ErrorMessage   string          `json:"error_message,omitempty"`
}

// Logger interface for audit logging
type Logger interface {
    // Log writes an audit event synchronously
    Log(ctx context.Context, event *Event) error

    // LogAsync writes an audit event asynchronously
    // Failures are logged but don't block the request
    LogAsync(ctx context.Context, event *Event)
}

// Builder provides a fluent interface for creating audit events
type Builder struct {
    event *Event
}

// NewBuilder creates a new audit event builder
func NewBuilder() *Builder {
    return &Builder{
        event: &Event{
            ID:        generateID(),
            Timestamp: time.Now().UTC(),
            Status:    "success",
        },
    }
}

func (b *Builder) WithUser(userID, orgID string) *Builder {
    b.event.UserID = userID
    b.event.OrganizationID = orgID
    return b
}

func (b *Builder) WithWorkspace(workspaceID string) *Builder {
    b.event.WorkspaceID = workspaceID
    return b
}

func (b *Builder) WithAction(action Action) *Builder {
    b.event.Action = action
    return b
}

func (b *Builder) WithEntity(entityType EntityType, entityID string) *Builder {
    b.event.EntityType = entityType
    b.event.EntityID = entityID
    return b
}

func (b *Builder) WithOldValue(v any) *Builder {
    data, _ := json.Marshal(sanitizeForAudit(v))
    b.event.OldValue = data
    return b
}

func (b *Builder) WithNewValue(v any) *Builder {
    data, _ := json.Marshal(sanitizeForAudit(v))
    b.event.NewValue = data
    return b
}

func (b *Builder) WithMetadata(metadata map[string]any) *Builder {
    b.event.Metadata = metadata
    return b
}

func (b *Builder) WithRequestContext(ctx context.Context) *Builder {
    if ip := ctx.Value("ip_address"); ip != nil {
        b.event.IPAddress = ip.(string)
    }
    if ua := ctx.Value("user_agent"); ua != nil {
        b.event.UserAgent = ua.(string)
    }
    if reqID := ctx.Value("request_id"); reqID != nil {
        b.event.RequestID = reqID.(string)
    }
    return b
}

func (b *Builder) WithError(err error) *Builder {
    b.event.Status = "failure"
    b.event.ErrorMessage = err.Error()
    return b
}

func (b *Builder) Build() *Event {
    return b.event
}

// sanitizeForAudit removes sensitive fields before logging
func sanitizeForAudit(v any) any {
    // Implementation removes password, tokens, etc.
    return v
}
```

### Audit Events Logged

| Category | Events |
|----------|--------|
| **Authentication** | Login success/failure, logout, password change, password reset, session invalidation |
| **Authorization** | Access denied, permission changes, role changes |
| **Data Access** | Create, read, update, delete for all entities |
| **Administrative** | User management, organization settings, workspace changes |
| **Security** | Token refresh, unusual activity, rate limiting |
| **Integration** | External API calls, webhook deliveries |

---

## Security Headers

**Location:** `services/gateway/internal/middleware/security.go`

```go
func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        h := w.Header()

        // ══════════════════════════════════════════════════════════════════
        // CONTENT SECURITY
        // ══════════════════════════════════════════════════════════════════

        // Prevent MIME type sniffing
        // Browsers sometimes try to "sniff" content type - this prevents it
        h.Set("X-Content-Type-Options", "nosniff")

        // Prevent clickjacking
        // Prevents the page from being embedded in iframes
        h.Set("X-Frame-Options", "DENY")

        // XSS protection for legacy browsers
        // Modern browsers have built-in XSS protection
        h.Set("X-XSS-Protection", "1; mode=block")

        // ══════════════════════════════════════════════════════════════════
        // TRANSPORT SECURITY
        // ══════════════════════════════════════════════════════════════════

        // HTTP Strict Transport Security
        // Forces browsers to use HTTPS for 1 year
        // includeSubDomains: all subdomains also HTTPS
        // preload: can be added to browser preload list
        if isProduction() {
            h.Set("Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload")
        }

        // ══════════════════════════════════════════════════════════════════
        // CONTENT SECURITY POLICY
        // ══════════════════════════════════════════════════════════════════

        // CSP for API responses (very restrictive)
        // default-src 'self': only load from same origin
        // frame-ancestors 'none': cannot be embedded
        // base-uri 'self': <base> tag restricted
        h.Set("Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")

        // ══════════════════════════════════════════════════════════════════
        // PRIVACY
        // ══════════════════════════════════════════════════════════════════

        // Referrer Policy
        // strict-origin-when-cross-origin: send origin for cross-origin,
        // full URL for same-origin, nothing for downgrade
        h.Set("Referrer-Policy", "strict-origin-when-cross-origin")

        // Permissions Policy (formerly Feature Policy)
        // Disable browser features we don't need
        h.Set("Permissions-Policy", strings.Join([]string{
            "accelerometer=()",
            "camera=()",
            "geolocation=()",
            "gyroscope=()",
            "magnetometer=()",
            "microphone=()",
            "payment=()",
            "usb=()",
            "interest-cohort=()",  // Disable FLoC
            "browsing-topics=()",   // Disable Topics API
        }, ", "))

        // ══════════════════════════════════════════════════════════════════
        // CROSS-ORIGIN ISOLATION
        // ══════════════════════════════════════════════════════════════════

        // Cross-Origin-Opener-Policy
        // Prevents cross-origin documents from opening in same context
        h.Set("Cross-Origin-Opener-Policy", "same-origin")

        // Cross-Origin-Resource-Policy
        // Prevents other sites from loading our resources
        h.Set("Cross-Origin-Resource-Policy", "same-origin")

        // Cross-Origin-Embedder-Policy
        // Requires cross-origin resources to explicitly grant permission
        h.Set("Cross-Origin-Embedder-Policy", "require-corp")

        // ══════════════════════════════════════════════════════════════════
        // CACHE CONTROL
        // ══════════════════════════════════════════════════════════════════

        // Prevent caching of API responses
        // Important for sensitive data
        h.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        h.Set("Pragma", "no-cache")
        h.Set("Expires", "0")

        next.ServeHTTP(w, r)
    })
}
```

### Header Summary

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | nosniff | Prevent MIME type sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | XSS protection (legacy) |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| `Content-Security-Policy` | default-src 'self'; frame-ancestors 'none' | Restrict content sources |
| `Referrer-Policy` | strict-origin-when-cross-origin | Limit referrer leakage |
| `Permissions-Policy` | interest-cohort=() | Disable browser tracking |
| `Cross-Origin-Opener-Policy` | same-origin | Isolation |
| `Cross-Origin-Resource-Policy` | same-origin | Prevent resource theft |
| `Cache-Control` | no-store | Prevent caching |

---

## Rate Limiting

### Rate Limit Configuration

| Endpoint Type | Limit | Window | Scope |
|---------------|-------|--------|-------|
| Authentication (`/auth/*`) | 5 requests | 15 minutes | Per IP |
| API (authenticated) | 1000 requests | 1 minute | Per user |
| API (unauthenticated) | 100 requests | 1 minute | Per IP |
| WebSocket connections | 10 concurrent | N/A | Per user |
| File uploads | 100 MB | Per request | Per user |

### Implementation

```go
type RateLimiter struct {
    store    *redis.Client
    limits   map[string]RateLimit
}

type RateLimit struct {
    Requests int
    Window   time.Duration
}

func (rl *RateLimiter) Check(ctx context.Context, key string, limit RateLimit) (allowed bool, remaining int, reset time.Time) {
    now := time.Now()
    windowKey := fmt.Sprintf("%s:%d", key, now.Unix()/int64(limit.Window.Seconds()))

    pipe := rl.store.Pipeline()
    incr := pipe.Incr(ctx, windowKey)
    pipe.Expire(ctx, windowKey, limit.Window)
    pipe.Exec(ctx)

    count := int(incr.Val())
    remaining = limit.Requests - count
    if remaining < 0 {
        remaining = 0
    }

    reset = now.Add(limit.Window).Truncate(limit.Window)
    allowed = count <= limit.Requests

    return
}
```

---

## Input Validation

### Validation Rules

```go
import "github.com/go-playground/validator/v10"

type CreatePortCallInput struct {
    VesselID      string    `json:"vessel_id" validate:"required,uuid4"`
    PortID        string    `json:"port_id" validate:"required,uuid4"`
    WorkspaceID   string    `json:"workspace_id" validate:"required,uuid4"`
    ETA           time.Time `json:"eta" validate:"required,gtfield=CreatedAt"`
    ETD           time.Time `json:"etd" validate:"required,gtfield=ETA"`
    BerthName     string    `json:"berth_name" validate:"max=100"`
    CargoType     string    `json:"cargo_type" validate:"max=100,oneof=bulk container tanker general"`
    CargoQuantity float64   `json:"cargo_quantity" validate:"gte=0,lte=1000000"`
    Notes         string    `json:"notes" validate:"max=5000"`
}

// SQL injection prevention - use parameterized queries ONLY
func (r *PortCallRepository) GetByID(ctx context.Context, id string) (*PortCall, error) {
    // CORRECT: Parameterized query
    query := `SELECT * FROM port_calls WHERE id = $1`
    row := r.pool.QueryRow(ctx, query, id)

    // NEVER do this:
    // query := fmt.Sprintf("SELECT * FROM port_calls WHERE id = '%s'", id)
}
```

---

## Secret Management

### Required Secrets

| Secret | Purpose | Rotation Period |
|--------|---------|-----------------|
| `JWT_SECRET` | JWT signing | 90 days |
| `DATABASE_URL` | Database connection | On demand |
| `REDIS_URL` | Cache connection | On demand |
| `SMTP_PASSWORD` | Email delivery | 90 days |
| `AIS_API_KEY` | Vessel tracking | Per provider policy |
| `S3_SECRET_KEY` | Document storage | 90 days |

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: navo-secrets
  namespace: navo
type: Opaque
data:
  JWT_SECRET: <base64-encoded-value>
  DATABASE_URL: <base64-encoded-value>
  REDIS_URL: <base64-encoded-value>
---
apiVersion: v1
kind: Secret
metadata:
  name: navo-smtp
  namespace: navo
type: Opaque
data:
  SMTP_PASSWORD: <base64-encoded-value>
```

---

## Vulnerability Management

### Security Scanning

| Tool | Target | Frequency |
|------|--------|-----------|
| `govulncheck` | Go dependencies | Every commit |
| `npm audit` | Node dependencies | Every commit |
| Trivy | Container images | Every build |
| Semgrep | Source code (SAST) | Every commit |
| OWASP ZAP | Running application (DAST) | Weekly |

### CI/CD Security Pipeline

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  go-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run govulncheck
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...

      - name: Run gosec
        uses: securego/gosec@master
        with:
          args: ./...

  node-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Semgrep
        uses: semgrep/semgrep-action@v1

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t navo:${{ github.sha }} .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: navo:${{ github.sha }}
          severity: HIGH,CRITICAL
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0** | Security breach | 15 min | Data exfiltration, unauthorized access |
| **P1** | Critical vulnerability | 1 hour | RCE, SQL injection in production |
| **P2** | High vulnerability | 24 hours | Auth bypass, privilege escalation |
| **P3** | Medium vulnerability | 1 week | XSS, CSRF, information disclosure |

### Response Procedures

1. **Detection** - Alert received via monitoring or report
2. **Triage** - Assess severity and scope
3. **Containment** - Isolate affected systems
4. **Investigation** - Determine root cause
5. **Eradication** - Remove threat
6. **Recovery** - Restore services
7. **Post-Mortem** - Document lessons learned

---

## Compliance

### Data Protection

- GDPR compliant data handling
- Right to erasure (data deletion)
- Data portability (export)
- Privacy by design

### Industry Standards

- OWASP Top 10 mitigation
- CIS Benchmarks for infrastructure
- SOC 2 Type II (in progress)

---

## Security Checklist

### Deployment Checklist

- [ ] JWT_SECRET is set and at least 32 characters
- [ ] PostgreSQL SSL mode is `require` or `verify-full`
- [ ] All external connections use HTTPS/TLS
- [ ] Security headers middleware is enabled
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled
- [ ] RLS policies are active on all tenant tables
- [ ] Secrets are stored in Kubernetes Secrets or Vault
- [ ] Container images scanned for vulnerabilities
- [ ] Network policies restrict pod communication

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] All user input is validated
- [ ] SQL queries use parameterized statements
- [ ] Sensitive data is not logged
- [ ] Error messages don't leak internal details
- [ ] Authentication is required on protected routes
- [ ] Authorization is checked for each action
- [ ] CSRF protection on state-changing endpoints
- [ ] File uploads validated and sanitized

### Security Contacts

- **Security Team:** security@navo.io
- **Bug Bounty:** Via HackerOne program
- **Emergency:** +1-XXX-XXX-XXXX (24/7)
