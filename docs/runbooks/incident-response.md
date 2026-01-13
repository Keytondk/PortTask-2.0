# Incident Response Runbook

This runbook provides procedures for responding to production incidents in the Navo platform.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1** | Complete outage | 15 min | All services down, data loss |
| **SEV2** | Major degradation | 30 min | Core feature unavailable |
| **SEV3** | Minor degradation | 2 hours | Non-critical feature issue |
| **SEV4** | Low impact | 24 hours | UI glitch, minor bug |

---

## Incident Response Process

### 1. Detection

Incidents may be detected via:
- Automated alerts (PagerDuty, Prometheus)
- Customer reports
- Internal monitoring dashboards
- Health check failures

### 2. Triage

**First Responder Actions:**

1. Acknowledge alert
2. Assess severity
3. Create incident channel: `#incident-YYYYMMDD-brief-description`
4. Post initial assessment
5. Escalate if needed

### 3. Investigation

```bash
# Check service status
kubectl get pods -n navo

# View recent logs
kubectl logs -f deployment/gateway -n navo --since=10m

# Check metrics
# Open Grafana dashboard

# Check recent deployments
kubectl rollout history deployment/gateway -n navo
```

### 4. Mitigation

Apply temporary fixes to restore service:
- Rollback deployment
- Scale up replicas
- Enable feature flags to disable problematic features
- Apply database fixes

### 5. Resolution

Implement permanent fix:
- Deploy code fix
- Update configuration
- Apply database migration

### 6. Post-Incident

- Update status page
- Notify stakeholders
- Schedule post-mortem
- Create follow-up tasks

---

## Common Scenarios

### Service Not Responding

**Symptoms:** 5xx errors, timeout errors, health check failures

**Investigation:**
```bash
# Check pod status
kubectl get pods -n navo -l app=gateway

# Check pod events
kubectl describe pod gateway-xxx -n navo

# Check logs
kubectl logs gateway-xxx -n navo --tail=100

# Check resource usage
kubectl top pods -n navo
```

**Resolution:**
```bash
# Restart pods
kubectl rollout restart deployment/gateway -n navo

# Scale up
kubectl scale deployment/gateway --replicas=5 -n navo

# Rollback if recent deployment
kubectl rollout undo deployment/gateway -n navo
```

---

### Database Connection Issues

**Symptoms:** Connection timeout errors, "too many connections"

**Investigation:**
```bash
# Check connection count
psql -h $DB_HOST -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check for locks
psql -h $DB_HOST -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check slow queries
psql -h $DB_HOST -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

**Resolution:**
```bash
# Terminate idle connections
psql -h $DB_HOST -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';"

# Restart service to clear connection pool
kubectl rollout restart deployment/core-service -n navo
```

---

### Redis Connection Issues

**Symptoms:** Cache misses, slow responses, connection errors

**Investigation:**
```bash
# Check Redis status
redis-cli -h $REDIS_HOST ping

# Check memory usage
redis-cli -h $REDIS_HOST info memory

# Check connected clients
redis-cli -h $REDIS_HOST client list
```

**Resolution:**
```bash
# Clear cache if corrupted
redis-cli -h $REDIS_HOST FLUSHDB

# Restart Redis (if self-managed)
kubectl rollout restart statefulset/redis -n navo
```

---

### High Latency

**Symptoms:** Slow response times, timeout errors

**Investigation:**
```bash
# Check service metrics
curl http://gateway:4000/metrics | grep http_request_duration

# Check database query times
# Review Prometheus/Grafana dashboards

# Check external API latency
curl -w "@curl-format.txt" -o /dev/null -s https://api.marinetraffic.com/
```

**Resolution:**
- Scale up affected service
- Add caching for slow queries
- Optimize database queries
- Check external API status

---

### Authentication Failures

**Symptoms:** 401 errors, login failures, token validation errors

**Investigation:**
```bash
# Check auth service logs
kubectl logs -f deployment/auth-service -n navo | grep -i error

# Verify JWT_SECRET is set
kubectl exec deployment/auth-service -n navo -- env | grep JWT

# Check token expiration settings
```

**Resolution:**
```bash
# Restart auth service
kubectl rollout restart deployment/auth-service -n navo

# If JWT_SECRET changed, all users need to re-login
# Consider graceful token refresh
```

---

### Memory/CPU Exhaustion

**Symptoms:** OOMKilled pods, high CPU usage, slow responses

**Investigation:**
```bash
# Check resource usage
kubectl top pods -n navo

# Check pod events
kubectl describe pod gateway-xxx -n navo | grep -A 10 Events

# Check for memory leaks
kubectl logs gateway-xxx -n navo | grep -i "memory\|heap\|gc"
```

**Resolution:**
```bash
# Increase resource limits
kubectl edit deployment/gateway -n navo
# Update limits.memory and limits.cpu

# Scale horizontally
kubectl scale deployment/gateway --replicas=5 -n navo

# Investigate and fix memory leak
```

---

### Data Inconsistency

**Symptoms:** Missing data, incorrect values, foreign key violations

**Investigation:**
```sql
-- Check for orphaned records
SELECT pc.* FROM port_calls pc
LEFT JOIN vessels v ON pc.vessel_id = v.id
WHERE v.id IS NULL;

-- Check for duplicates
SELECT reference, COUNT(*)
FROM port_calls
GROUP BY reference
HAVING COUNT(*) > 1;

-- Check audit logs
SELECT * FROM audit_logs
WHERE entity_type = 'port_call'
ORDER BY timestamp DESC
LIMIT 100;
```

**Resolution:**
```sql
-- Fix orphaned records (careful!)
DELETE FROM port_calls WHERE vessel_id NOT IN (SELECT id FROM vessels);

-- Restore from backup if needed
pg_restore -h $DB_HOST -U postgres -d navo_restored backup.dump
```

---

## Rollback Procedures

### Application Rollback

```bash
# View deployment history
kubectl rollout history deployment/gateway -n navo

# Rollback to previous version
kubectl rollout undo deployment/gateway -n navo

# Rollback to specific version
kubectl rollout undo deployment/gateway --to-revision=5 -n navo

# Verify rollback
kubectl rollout status deployment/gateway -n navo
```

### Database Rollback

**Point-in-Time Recovery (AWS RDS):**
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier navo-prod \
  --target-db-instance-identifier navo-restored \
  --restore-time 2024-01-15T10:00:00Z
```

**Manual Restore:**
```bash
# Create new database
createdb -h $DB_HOST -U postgres navo_restored

# Restore from backup
pg_restore -h $DB_HOST -U postgres -d navo_restored /backups/navo_20240115.dump

# Update application to use restored database
kubectl set env deployment/core-service DATABASE_URL=postgres://...navo_restored -n navo
```

---

## Communication Templates

### Initial Incident Notification

```
🚨 INCIDENT: [Brief Description]

Severity: SEV[1-4]
Impact: [Description of user impact]
Status: Investigating

Incident Commander: @name
Channel: #incident-YYYYMMDD-xxx
```

### Status Update

```
📢 UPDATE: [Brief Description]

Time: [HH:MM UTC]
Status: [Investigating/Mitigating/Resolved]
Update: [What has changed]
Next Steps: [What we're doing next]
ETA: [If known]
```

### Resolution Notification

```
✅ RESOLVED: [Brief Description]

Duration: [X hours Y minutes]
Root Cause: [Brief explanation]
Resolution: [What fixed it]
Follow-up: [Post-mortem scheduled for DATE]
```

---

## Escalation Matrix

| Severity | Primary | Secondary | Management |
|----------|---------|-----------|------------|
| SEV1 | On-call Engineer | Tech Lead | VP Engineering |
| SEV2 | On-call Engineer | Team Lead | Engineering Manager |
| SEV3 | On-call Engineer | Team Lead | - |
| SEV4 | Any Engineer | - | - |

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| On-Call | PagerDuty | @oncall |
| Tech Lead | [Name] | [Phone/Slack] |
| VP Engineering | [Name] | [Phone/Slack] |
| Database Admin | [Name] | [Phone/Slack] |
| Security | [Name] | [Phone/Slack] |

---

## Post-Incident Checklist

- [ ] Incident channel created and documented
- [ ] Timeline documented
- [ ] Root cause identified
- [ ] Immediate fix applied
- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Post-mortem scheduled
- [ ] Follow-up issues created
- [ ] Monitoring/alerting improved
- [ ] Runbook updated (if needed)

---

## Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV[1-4]
**Authors:** [Names]

## Summary
Brief description of what happened.

## Impact
- Users affected: [Number]
- Revenue impact: [If applicable]
- Data loss: [Yes/No, details]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | First alert triggered |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |

## Root Cause
Detailed explanation of what caused the incident.

## Resolution
What was done to resolve the incident.

## Lessons Learned
### What went well
- ...

### What went wrong
- ...

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| Improve monitoring for X | @name | YYYY-MM-DD |
| Add automated recovery for Y | @name | YYYY-MM-DD |
```
