# Navo Production Deployment Guide

This guide covers deploying the Navo platform to production environments.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │         Cloud Load Balancer          │
                        │        (SSL Termination)             │
                        └─────────────────┬───────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
            ┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐
            │  Key App CDN  │     │ Portal App CDN│     │ Vendor App CDN│
            │   (Vercel)    │     │   (Vercel)    │     │   (Vercel)    │
            └───────────────┘     └───────────────┘     └───────────────┘
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          │
                        ┌─────────────────▼───────────────────┐
                        │           API Gateway               │
                        │     (Kubernetes Ingress)            │
                        └─────────────────┬───────────────────┘
                                          │
                        ┌─────────────────▼───────────────────┐
                        │         Kubernetes Cluster          │
                        │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
                        │   │Auth │ │Core │ │Vessel│ │Real │   │
                        │   │ Svc │ │ Svc │ │ Svc │ │time │   │
                        │   └─────┘ └─────┘ └─────┘ └─────┘   │
                        └─────────────────┬───────────────────┘
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                │                         │                         │
        ┌───────▼───────┐         ┌───────▼───────┐         ┌───────▼───────┐
        │  PostgreSQL   │         │     Redis     │         │   S3/MinIO    │
        │   (RDS/Cloud) │         │  (ElastiCache)│         │   (Storage)   │
        └───────────────┘         └───────────────┘         └───────────────┘
```

---

## Infrastructure Requirements

### Compute

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| API Gateway | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| Auth Service | 1 vCPU, 2GB RAM | 2 vCPU, 4GB RAM |
| Core Service | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| Vessel Service | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| Realtime Service | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM |
| Worker Service | 1 vCPU, 2GB RAM | 2 vCPU, 4GB RAM |

### Database

| Specification | Minimum | Recommended |
|---------------|---------|-------------|
| PostgreSQL | db.t3.medium | db.r6g.large |
| Storage | 100GB SSD | 500GB SSD |
| IOPS | 3000 | 10000 |
| Multi-AZ | Optional | Required |

### Cache

| Specification | Minimum | Recommended |
|---------------|---------|-------------|
| Redis | cache.t3.small | cache.r6g.large |
| Memory | 2GB | 8GB |
| Cluster Mode | Single | Cluster |

### Storage

| Specification | Minimum | Recommended |
|---------------|---------|-------------|
| S3 Bucket | Standard | Standard-IA for archives |
| Encryption | SSE-S3 | SSE-KMS |

---

## Kubernetes Deployment

### Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: navo
  labels:
    app.kubernetes.io/name: navo
```

### Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: navo-secrets
  namespace: navo
type: Opaque
stringData:
  JWT_SECRET: "your-production-jwt-secret-minimum-32-characters"
  DATABASE_URL: "postgres://user:pass@host:5432/navo?sslmode=require"
  REDIS_URL: "redis://host:6379"
  SMTP_PASSWORD: "your-smtp-password"
  AIS_API_KEY: "your-ais-api-key"
  S3_SECRET_KEY: "your-s3-secret"
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: navo-config
  namespace: navo
data:
  GO_ENV: "production"
  DB_SSL_MODE: "require"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  AUTH_SERVICE_URL: "http://auth-service:4001"
  CORE_SERVICE_URL: "http://core-service:4002"
  VESSEL_SERVICE_URL: "http://vessel-service:4003"
  REALTIME_SERVICE_URL: "http://realtime-service:4004"
```

### Gateway Deployment

```yaml
# gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: navo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: navo/gateway:latest
          ports:
            - containerPort: 4000
          envFrom:
            - configMapRef:
                name: navo-config
            - secretRef:
                name: navo-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
  namespace: navo
spec:
  selector:
    app: gateway
  ports:
    - port: 4000
      targetPort: 4000
  type: ClusterIP
```

### Core Service Deployment

```yaml
# core-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-service
  namespace: navo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: core-service
  template:
    metadata:
      labels:
        app: core-service
    spec:
      containers:
        - name: core
          image: navo/core:latest
          ports:
            - containerPort: 4002
          envFrom:
            - configMapRef:
                name: navo-config
            - secretRef:
                name: navo-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4002
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 4002
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: core-service
  namespace: navo
spec:
  selector:
    app: core-service
  ports:
    - port: 4002
      targetPort: 4002
  type: ClusterIP
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: navo-ingress
  namespace: navo
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
    - hosts:
        - api.navo.io
      secretName: navo-tls
  rules:
    - host: api.navo.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 4000
```

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-hpa
  namespace: navo
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database and user
CREATE DATABASE navo;
CREATE USER navo_app WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE navo TO navo_app;

-- Configure for performance
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
```

### Run Migrations

```bash
# From CI/CD pipeline or migration job
DATABASE_URL="postgres://..." pnpm --filter @navo/db db:push
```

### Enable RLS

```sql
-- Run migration
\i packages/db/migrations/001_add_rls_policies.sql
```

---

## Frontend Deployment

### Vercel Configuration

```json
// vercel.json (apps/key)
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "fra1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_WS_URL": "@ws_url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Environment Variables (Vercel)

```bash
# Set via Vercel CLI or Dashboard
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_AUTH_URL production
vercel env add NEXT_PUBLIC_WS_URL production
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN production
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository }}

jobs:
  build-services:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [gateway, auth, core, vessel, realtime, notification, worker]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-services
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/gateway \
            gateway=${{ env.IMAGE_PREFIX }}/gateway:${{ github.sha }} \
            -n navo
          kubectl set image deployment/core-service \
            core=${{ env.IMAGE_PREFIX }}/core:${{ github.sha }} \
            -n navo
          # ... other services

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/gateway -n navo
          kubectl rollout status deployment/core-service -n navo
```

### Dockerfile Example

```dockerfile
# services/gateway/Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /gateway ./cmd/main.go

# Runtime image
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /gateway .

EXPOSE 4000

CMD ["./gateway"]
```

---

## Monitoring

### Prometheus Metrics

```yaml
# prometheus-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: navo-services
  namespace: navo
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: navo
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

### Grafana Dashboards

Import dashboards for:
- Service health and latency
- Request rates and error rates
- Database connections and query times
- Redis cache hit rates
- WebSocket connections

### Alerting Rules

```yaml
# alerting-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: navo-alerts
  namespace: navo
spec:
  groups:
    - name: navo
      rules:
        - alert: HighErrorRate
          expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: High error rate detected
            description: Error rate is above 5%

        - alert: ServiceDown
          expr: up{job=~"navo-.*"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: Service is down
```

---

## Security Checklist

### Pre-Deployment

- [ ] JWT_SECRET is set and at least 32 characters
- [ ] DATABASE_URL uses SSL (sslmode=require)
- [ ] All secrets stored in Kubernetes Secrets or Vault
- [ ] Network policies restrict pod communication
- [ ] Pod security policies enforced
- [ ] Image scanning enabled in CI/CD
- [ ] RBAC configured for service accounts

### Post-Deployment

- [ ] SSL certificates valid and auto-renewing
- [ ] Security headers present on all responses
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Monitoring and alerting active
- [ ] Backup and recovery tested

---

## Backup and Recovery

### Database Backups

```bash
# Automated daily backups via AWS RDS or similar
# Point-in-time recovery enabled
# Retention: 30 days
```

### Manual Backup

```bash
pg_dump -Fc -h host -U user -d navo > navo_$(date +%Y%m%d).dump
```

### Recovery

```bash
pg_restore -h host -U user -d navo navo_20240101.dump
```

---

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/gateway -n navo

# Rollback to previous version
kubectl rollout undo deployment/gateway -n navo

# Rollback to specific revision
kubectl rollout undo deployment/gateway --to-revision=2 -n navo
```

### Database Rollback

```bash
# Point-in-time recovery (RDS)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier navo-prod \
  --target-db-instance-identifier navo-restored \
  --restore-time 2024-01-01T12:00:00Z
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check pod status
kubectl get pods -n navo

# View logs
kubectl logs -f deployment/gateway -n navo

# Describe pod for events
kubectl describe pod gateway-xxx -n navo
```

### Database Connection Issues

```bash
# Test connection from pod
kubectl exec -it deployment/gateway -n navo -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
kubectl exec -it deployment/core-service -n navo -- \
  wget -qO- http://localhost:4002/health
```

### High Latency

1. Check Prometheus metrics for bottlenecks
2. Review database query performance
3. Check Redis cache hit rates
4. Verify pod resource limits

---

## Cost Optimization

### Right-Sizing

- Start with recommended sizes
- Monitor actual usage for 2 weeks
- Adjust based on metrics

### Spot Instances

Use spot instances for non-critical workloads (workers, analytics).

### Reserved Capacity

Reserve database and cache instances for 1+ year for significant savings.

---

## Next Steps

- [Runbook: Incident Response](./runbooks/incident-response.md)
- [Runbook: Database Operations](./runbooks/database-ops.md)
- [Architecture Overview](../architecture/overview.md)
