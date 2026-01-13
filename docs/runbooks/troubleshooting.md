# Navo Troubleshooting Guide

This guide covers common issues, their diagnosis, and solutions for the Navo platform.

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Service-Specific Issues](#service-specific-issues)
4. [Database Issues](#database-issues)
5. [Frontend Issues](#frontend-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Integration Issues](#integration-issues)
9. [FAQ](#faq)

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check all service health (Kubernetes)
kubectl get pods -n navo
kubectl get services -n navo

# Check specific service health
curl http://localhost:4000/health
curl http://localhost:4000/health/ready
curl http://localhost:4000/health/live

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connectivity
redis-cli -u $REDIS_URL ping

# Check service logs
kubectl logs -f deployment/gateway -n navo --tail=100
docker logs navo-gateway-1 --tail=100
```

### System Status Checklist

| Component | Check Command | Expected Output |
|-----------|---------------|-----------------|
| Gateway | `curl localhost:4000/health` | `{"status":"healthy"}` |
| Auth Service | `curl localhost:4001/health` | `{"status":"healthy"}` |
| Core Service | `curl localhost:4002/health` | `{"status":"healthy"}` |
| Vessel Service | `curl localhost:4003/health` | `{"status":"healthy"}` |
| PostgreSQL | `pg_isready -h localhost` | `accepting connections` |
| Redis | `redis-cli ping` | `PONG` |

---

## Common Issues

### 1. Service Won't Start

#### Symptoms
- Service exits immediately
- "Connection refused" errors
- Pod stuck in CrashLoopBackOff

#### Diagnosis

```bash
# Check container logs
kubectl logs deployment/gateway -n navo --previous
docker logs navo-gateway-1

# Check environment variables
kubectl exec deployment/gateway -n navo -- env | grep -E "(DATABASE|REDIS|JWT)"

# Check resource limits
kubectl describe pod gateway-xxx -n navo | grep -A5 "Limits"
```

#### Solutions

**Missing environment variables:**
```bash
# Verify required variables are set
echo $DATABASE_URL
echo $REDIS_URL
echo $JWT_SECRET

# Check Kubernetes secrets
kubectl get secret navo-secrets -n navo -o yaml
```

**Database not ready:**
```bash
# Wait for database to be ready
until pg_isready -h $DB_HOST -p 5432; do
  echo "Waiting for database..."
  sleep 2
done
```

**Insufficient resources:**
```yaml
# Increase resource limits in deployment
resources:
  limits:
    memory: "2Gi"
    cpu: "1000m"
  requests:
    memory: "512Mi"
    cpu: "250m"
```

---

### 2. Authentication Failures

#### Symptoms
- 401 Unauthorized errors
- "Token expired" or "Token invalid" messages
- Login fails despite correct credentials

#### Diagnosis

```bash
# Check JWT_SECRET consistency across services
kubectl exec deployment/gateway -n navo -- printenv JWT_SECRET | md5sum
kubectl exec deployment/auth-service -n navo -- printenv JWT_SECRET | md5sum

# Decode and inspect token
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .

# Check token expiration
curl -H "Authorization: Bearer $TOKEN" localhost:4000/api/v1/auth/me -v
```

#### Solutions

**Token expired:**
```javascript
// Client-side: Implement token refresh
async function refreshToken() {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: getRefreshToken() })
  });
  const data = await response.json();
  setAccessToken(data.access_token);
}
```

**JWT_SECRET mismatch:**
```bash
# Ensure all services use the same secret
kubectl delete secret navo-secrets -n navo
kubectl create secret generic navo-secrets -n navo \
  --from-literal=JWT_SECRET="consistent-secret-across-all-services"
kubectl rollout restart deployment -n navo
```

**Account locked:**
```sql
-- Unlock user account
UPDATE users
SET locked_until = NULL, failed_login_attempts = 0
WHERE email = 'user@example.com';
```

---

### 3. Database Connection Issues

#### Symptoms
- "Connection refused" errors
- "Too many connections" errors
- Timeout errors on queries
- Slow response times

#### Diagnosis

```bash
# Check connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check active queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
ORDER BY duration DESC;"

# Check for locks
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check connection pool settings
kubectl exec deployment/core-service -n navo -- cat /app/config.yaml | grep pool
```

#### Solutions

**Too many connections:**
```sql
-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';
```

**Connection pool exhausted:**
```go
// Increase pool size in config
poolConfig.MaxConns = 100
poolConfig.MinConns = 10
poolConfig.MaxConnLifetime = 30 * time.Minute
```

**Slow queries:**
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, calls, total_time/calls as avg_time_ms
FROM pg_stat_statements
ORDER BY avg_time_ms DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_port_calls_eta ON port_calls(eta);
```

---

### 4. API Errors

#### 400 Bad Request

**Symptoms:** Validation failures, malformed JSON

**Diagnosis:**
```bash
# Check request body
curl -X POST localhost:4000/api/v1/port-calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vessel_id": "invalid"}' -v
```

**Solution:** Validate request body matches API schema. Check field types and required fields.

#### 403 Forbidden

**Symptoms:** User authenticated but action denied

**Diagnosis:**
```bash
# Check user permissions
curl -H "Authorization: Bearer $TOKEN" localhost:4000/api/v1/auth/me | jq .permissions
```

**Solution:**
```sql
-- Check user role
SELECT u.email, u.role, array_agg(uw.workspace_id) as workspaces
FROM users u
LEFT JOIN user_workspaces uw ON u.id = uw.user_id
WHERE u.email = 'user@example.com'
GROUP BY u.id;

-- Update role if needed
UPDATE users SET role = 'operator' WHERE email = 'user@example.com';
```

#### 404 Not Found

**Symptoms:** Resource doesn't exist or access denied by RLS

**Diagnosis:**
```sql
-- Check if resource exists
SELECT * FROM port_calls WHERE id = 'pc_xxx';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'port_calls';
```

**Solution:** Verify resource exists and user has workspace access.

#### 429 Rate Limited

**Symptoms:** Too many requests

**Diagnosis:**
```bash
# Check rate limit headers
curl -I -H "Authorization: Bearer $TOKEN" localhost:4000/api/v1/port-calls
# Look for: X-RateLimit-Remaining, X-RateLimit-Reset
```

**Solution:** Implement exponential backoff or request throttling in client.

---

### 5. WebSocket Connection Issues

#### Symptoms
- Connection drops frequently
- "Connection refused" errors
- Messages not received

#### Diagnosis

```bash
# Test WebSocket connection
websocat "ws://localhost:4004/ws?token=$TOKEN"

# Check WebSocket service logs
kubectl logs -f deployment/realtime-service -n navo

# Check connection count
redis-cli -u $REDIS_URL GET "ws:connections:count"
```

#### Solutions

**Connection drops:**
```javascript
// Implement reconnection with backoff
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  const ws = new WebSocket(wsUrl);

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connect, delay);
      reconnectAttempts++;
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}
```

**Firewall/Proxy issues:**
```nginx
# Nginx configuration for WebSocket
location /ws {
    proxy_pass http://realtime-service:4004;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

---

## Service-Specific Issues

### Gateway Service

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend service down | Check downstream service health |
| High latency | Slow backend | Check backend metrics, scale if needed |
| CORS errors | Missing headers | Verify CORS configuration |

### Auth Service

| Issue | Cause | Solution |
|-------|-------|----------|
| Login always fails | Database connection | Check DATABASE_URL |
| Password reset fails | SMTP not configured | Configure SMTP_* variables |
| Session lost | Redis connection | Check REDIS_URL |

### Core Service

| Issue | Cause | Solution |
|-------|-------|----------|
| Port calls not saving | Database error | Check DB logs, verify schema |
| Status transition fails | Invalid workflow | Check status state machine |
| Missing data | RLS filtering | Verify organization/workspace context |

### Vessel Service

| Issue | Cause | Solution |
|-------|-------|----------|
| No position updates | AIS provider issue | Check AIS_API_KEY, provider status |
| Stale positions | Worker not running | Check worker pod status |
| Map not loading | Missing API key | Verify MAPBOX_TOKEN |

---

## Database Issues

### Migration Failures

```bash
# Check migration status
pnpm --filter @navo/db db:migrate:status

# Reset failed migration (development only!)
pnpm --filter @navo/db db:migrate:reset

# Manual migration
psql $DATABASE_URL -f packages/db/migrations/xxx_migration.sql
```

### Data Corruption

```sql
-- Check for orphaned records
SELECT pc.id FROM port_calls pc
LEFT JOIN vessels v ON pc.vessel_id = v.id
WHERE v.id IS NULL;

-- Check for duplicate references
SELECT reference, COUNT(*)
FROM port_calls
GROUP BY reference, organization_id
HAVING COUNT(*) > 1;
```

### Performance Degradation

```sql
-- Analyze table statistics
ANALYZE VERBOSE port_calls;

-- Reindex if needed
REINDEX TABLE port_calls;

-- Vacuum to reclaim space
VACUUM FULL ANALYZE port_calls;
```

---

## Frontend Issues

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
pnpm install --force

# Check TypeScript errors
pnpm typecheck
```

### Hydration Errors

**Symptoms:** Content mismatch between server and client

**Solution:**
```tsx
// Use dynamic import for client-only components
import dynamic from 'next/dynamic';

const ClientOnlyMap = dynamic(
  () => import('@/components/Map'),
  { ssr: false }
);
```

### API Calls Failing

```typescript
// Check API URL configuration
console.log(process.env.NEXT_PUBLIC_API_URL);

// Verify CORS
fetch('/api/v1/port-calls')
  .then(r => console.log(r.headers.get('access-control-allow-origin')))
  .catch(e => console.error(e));
```

---

## Performance Issues

### High CPU Usage

```bash
# Identify hot spots
kubectl top pods -n navo
kubectl exec deployment/gateway -n navo -- top -b -n 1

# Go CPU profiling
curl localhost:4000/debug/pprof/profile?seconds=30 > cpu.prof
go tool pprof cpu.prof
```

### Memory Leaks

```bash
# Monitor memory usage
kubectl top pods -n navo --containers

# Go memory profiling
curl localhost:4000/debug/pprof/heap > heap.prof
go tool pprof heap.prof
```

### Slow Queries

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

## Security Issues

### Suspicious Activity

```sql
-- Check recent failed logins
SELECT email, failed_login_attempts, locked_until
FROM users
WHERE failed_login_attempts > 0
ORDER BY failed_login_attempts DESC;

-- Check audit logs for suspicious activity
SELECT * FROM audit_logs
WHERE action IN ('login_failed', 'permission_denied')
AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Token Compromise

```bash
# Revoke all sessions for user
psql $DATABASE_URL -c "
  UPDATE sessions
  SET is_revoked = true, revoked_reason = 'security_incident'
  WHERE user_id = 'usr_xxx';
"

# Force password reset
psql $DATABASE_URL -c "
  UPDATE users
  SET password_reset_required = true
  WHERE id = 'usr_xxx';
"
```

---

## Integration Issues

### AIS Provider

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| No data | Check API key validity | Renew API key |
| Rate limited | Check quota usage | Reduce polling frequency |
| Stale data | Provider latency | Check provider status page |

### Email (SMTP)

```bash
# Test SMTP connection
telnet smtp.provider.com 587

# Check service logs for email errors
kubectl logs deployment/notification-service -n navo | grep -i smtp
```

### S3 Storage

```bash
# Test S3 access
aws s3 ls s3://navo-documents/ --profile navo

# Check bucket policy
aws s3api get-bucket-policy --bucket navo-documents
```

---

## FAQ

### General

**Q: How do I reset my local development environment?**

```bash
docker compose down -v
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
docker compose up -d postgres redis
pnpm --filter @navo/db db:push
pnpm --filter @navo/db db:seed
```

**Q: How do I add a new user for testing?**

```sql
INSERT INTO users (id, email, password_hash, name, organization_id, role)
VALUES (
  gen_random_uuid(),
  'newuser@test.com',
  '$2a$12$...',  -- bcrypt hash of 'password123'
  'Test User',
  'org_xxx',
  'operator'
);
```

**Q: How do I check what version is deployed?**

```bash
kubectl get deployment -n navo -o jsonpath='{.items[*].spec.template.spec.containers[0].image}'
```

### Development

**Q: Why isn't my Go code reloading?**

Use `air` for hot reloading:
```bash
go install github.com/cosmtrek/air@latest
cd services/gateway && air
```

**Q: How do I debug a Go service?**

```bash
# Run with delve
dlv debug ./cmd/main.go

# Or attach to running process
dlv attach <pid>
```

**Q: How do I view database queries being executed?**

```bash
# Enable query logging in PostgreSQL
docker exec navo-postgres-1 psql -U navo -c "ALTER SYSTEM SET log_statement = 'all';"
docker exec navo-postgres-1 psql -U navo -c "SELECT pg_reload_conf();"
docker logs -f navo-postgres-1
```

### Production

**Q: How do I scale a service?**

```bash
kubectl scale deployment/core-service --replicas=5 -n navo
```

**Q: How do I view production logs?**

```bash
kubectl logs -f deployment/gateway -n navo --tail=100
# Or use log aggregation (Loki, CloudWatch, etc.)
```

**Q: How do I perform a rolling update?**

```bash
kubectl set image deployment/gateway gateway=navo/gateway:v1.2.3 -n navo
kubectl rollout status deployment/gateway -n navo
```

**Q: How do I rollback a bad deployment?**

```bash
kubectl rollout undo deployment/gateway -n navo
```

---

## Getting Help

1. **Check logs** - Service logs often contain the answer
2. **Check metrics** - Prometheus/Grafana for patterns
3. **Search documentation** - This guide and related docs
4. **Slack channel** - #navo-dev for team discussions
5. **Create an issue** - For bugs or unclear documentation

### Useful Links

- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/README.md)
- [Incident Response](./incident-response.md)
- [Security Guide](../architecture/security.md)
