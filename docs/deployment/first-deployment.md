# Navo First Deployment Guide

This guide walks you through deploying Navo for the first time.

---

## Pre-Deployment Checklist

Run the pre-flight validation script:

```bash
./scripts/preflight.sh production
```

### Critical Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Node.js 18+ | Required | `node -v` |
| pnpm 8+ | Required | `pnpm -v` |
| Go 1.22+ | Required | `go version` |
| Docker | Required | For building images |
| kubectl | Required | For Kubernetes deployment |

### Environment Secrets (Must Have Before Deploy)

```bash
# Generate secure secrets before deployment
JWT_SECRET=$(openssl rand -base64 48)
DB_PASSWORD=$(openssl rand -base64 24)

echo "JWT_SECRET=$JWT_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
```

---

## Deployment Options

| Option | Best For | Complexity |
|--------|----------|------------|
| **Railway + Vercel** | Quick start, small scale | Low |
| **Kubernetes (EKS/GKE)** | Production, enterprise | Medium |
| **Docker Compose** | Staging, self-hosted | Low |

---

## Option 1: Railway + Vercel (Quick Start)

### Step 1: Database Setup

```bash
# Create PostgreSQL on Railway
railway login
railway init
railway add --database postgres

# Get connection string
railway variables
# Copy DATABASE_URL
```

### Step 2: Configure Secrets

```bash
# Set secrets on Railway
railway variables set JWT_SECRET="$(openssl rand -base64 48)"
railway variables set GO_ENV="production"
railway variables set DB_SSL_MODE="require"
```

### Step 3: Deploy Backend Services

```bash
# Link and deploy each service
cd services/gateway && railway up --detach
cd ../core && railway up --detach
cd ../vessel && railway up --detach
cd ../realtime && railway up --detach
cd ../notification && railway up --detach
```

### Step 4: Run Database Migration

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://..."

# Push schema
pnpm db:push

# Run RLS migration
psql $DATABASE_URL -f packages/db/migrations/001_add_rls_policies.sql

# Seed initial data (optional)
pnpm db:seed
```

### Step 5: Deploy Frontend Apps

```bash
# Deploy to Vercel
cd apps/key && vercel --prod
cd ../portal && vercel --prod
cd ../vendor && vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-gateway.railway.app
# NEXT_PUBLIC_WS_URL=wss://your-realtime.railway.app
```

---

## Option 2: Kubernetes Deployment

### Step 1: Cluster Setup

```bash
# Create cluster (AWS EKS example)
eksctl create cluster \
  --name navo-production \
  --region us-east-1 \
  --nodegroup-name standard \
  --node-type t3.medium \
  --nodes 3
```

### Step 2: Install Prerequisites

```bash
# Install Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install External Secrets Operator (optional)
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace
```

### Step 3: Create Namespace and Secrets

```bash
# Apply namespace
kubectl apply -f deploy/k8s/namespace.yaml

# Create secrets (use External Secrets in production)
kubectl create secret generic navo-secrets -n navo \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)" \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=REDIS_URL="redis://..." \
  --from-literal=SMTP_PASSWORD="..." \
  --from-literal=AIS_API_KEY="..."

# Or use External Secrets
kubectl apply -f deploy/k8s/external-secrets/aws-secrets-store.yaml
```

### Step 4: Database Setup

```bash
# Option A: Use managed database (RDS, Cloud SQL)
# Create PostgreSQL instance in AWS/GCP console

# Option B: Deploy PostgreSQL in cluster (not recommended for prod)
helm install postgres bitnami/postgresql -n navo \
  --set auth.postgresPassword=secure-password \
  --set auth.database=navo
```

```bash
# Run migrations
export DATABASE_URL="postgresql://..."

# Push schema
pnpm db:push

# Apply RLS policies
psql $DATABASE_URL -f packages/db/migrations/001_add_rls_policies.sql
```

### Step 5: Build and Push Images

```bash
# Set your registry
REGISTRY=ghcr.io/your-org/navo

# Build and push all services
for service in gateway core vessel realtime notification; do
  docker build -t $REGISTRY/$service:v1.0.0 -f services/$service/Dockerfile .
  docker push $REGISTRY/$service:v1.0.0
done
```

### Step 6: Deploy Services

```bash
# Apply ConfigMap
kubectl apply -f deploy/k8s/configmap.yaml

# Deploy services (update image tags first)
kubectl apply -f deploy/k8s/gateway-deployment.yaml
kubectl apply -f deploy/k8s/core-deployment.yaml
kubectl apply -f deploy/k8s/vessel-deployment.yaml
kubectl apply -f deploy/k8s/realtime-deployment.yaml
kubectl apply -f deploy/k8s/notification-deployment.yaml

# Apply Ingress
kubectl apply -f deploy/k8s/ingress.yaml

# Verify
kubectl get pods -n navo
kubectl get svc -n navo
```

### Step 7: Deploy Frontend

```bash
# Option A: Vercel (recommended)
cd apps/key && vercel --prod

# Option B: Build and deploy to K8s
docker build -t $REGISTRY/key-app:v1.0.0 -f apps/key/Dockerfile .
kubectl apply -f deploy/k8s/key-app-deployment.yaml
```

---

## Option 3: Docker Compose (Staging/Self-Hosted)

### Step 1: Prepare Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

Required `.env` values:
```bash
# Security
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters

# Database (can use provided or external)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/navo?sslmode=disable

# Redis
REDIS_URL=redis://redis:6379

# Optional integrations
AIS_API_KEY=your-ais-api-key
SMTP_PASSWORD=your-smtp-password
```

### Step 2: Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Run Migrations

```bash
# Wait for postgres to be ready
sleep 10

# Push schema
docker-compose exec gateway /bin/sh -c "cd /app && pnpm db:push"

# Or from host
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/navo pnpm db:push
```

### Step 4: Verify

```bash
# Check health endpoints
curl http://localhost:8080/health

# Check database
docker-compose exec postgres psql -U postgres -d navo -c "\dt"
```

---

## Post-Deployment Steps

### 1. Verify All Services

```bash
# Health checks
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/ready

# API test
curl https://api.yourdomain.com/api/v1/health
```

### 2. Create Initial Admin User

```sql
-- Connect to database
psql $DATABASE_URL

-- Create organization
INSERT INTO organizations (id, name, type, status)
VALUES ('org_initial', 'Your Company', 'operator', 'active');

-- Create admin user (use bcrypt hash of your password)
INSERT INTO users (id, email, password_hash, name, organization_id, roles, status)
VALUES (
  'usr_admin',
  'admin@yourcompany.com',
  '$2a$12$...',  -- bcrypt hash
  'Admin User',
  'org_initial',
  '["admin"]',
  'active'
);

-- Create workspace
INSERT INTO workspaces (id, name, organization_id, type, status)
VALUES ('ws_default', 'Default Workspace', 'org_initial', 'internal', 'active');

-- Link user to workspace
INSERT INTO user_workspaces (id, user_id, workspace_id, role)
VALUES ('uw_1', 'usr_admin', 'ws_default', 'admin');
```

### 3. Configure DNS

```
# A Records (if using IP)
api.yourdomain.com    -> Load Balancer IP
ws.yourdomain.com     -> WebSocket Service IP

# CNAME Records (if using hostname)
api.yourdomain.com    -> your-lb.elb.amazonaws.com
app.yourdomain.com    -> your-app.vercel.app
```

### 4. Enable Monitoring

```bash
# Install Prometheus stack (K8s)
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Apply ServiceMonitor
kubectl apply -f deploy/k8s/monitoring/servicemonitor.yaml
```

### 5. Set Up Backups

```bash
# AWS RDS automated backups
aws rds modify-db-instance \
  --db-instance-identifier navo-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

---

## Validation Checklist

### Security

- [ ] JWT_SECRET is unique and at least 32 characters
- [ ] DATABASE_URL uses `sslmode=require`
- [ ] All secrets are stored securely (not in code)
- [ ] HTTPS/TLS enabled
- [ ] Security headers present (check with curl -I)

### Functionality

- [ ] Can log in as admin user
- [ ] Can create port call
- [ ] WebSocket connections work
- [ ] Email notifications send (if configured)

### Performance

- [ ] Health endpoints respond < 100ms
- [ ] Database queries < 500ms
- [ ] No memory leaks (monitor over 24h)

### Monitoring

- [ ] Logs are being collected
- [ ] Metrics are being scraped
- [ ] Alerts are configured

---

## Troubleshooting First Deploy

### Service Won't Start

```bash
# Check logs
kubectl logs deployment/gateway -n navo
docker-compose logs gateway

# Common issues:
# - Missing environment variables
# - Database not reachable
# - Port already in use
```

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check network
kubectl exec -it deployment/gateway -n navo -- nc -zv postgres 5432

# Common issues:
# - Wrong credentials
# - Firewall/security group blocking
# - SSL mode mismatch
```

### RLS Blocking Queries

```bash
# Ensure context is set
psql $DATABASE_URL -c "SET app.current_organization_id = 'your-org-id'; SELECT * FROM users;"

# Check policies
psql $DATABASE_URL -c "SELECT * FROM pg_policies;"
```

---

## Next Steps After First Deploy

1. **Configure CI/CD** - Set up GitHub Actions for automated deployments
2. **Set up staging** - Create a staging environment for testing
3. **Configure alerts** - Set up PagerDuty/Slack alerts
4. **Load testing** - Run load tests to verify capacity
5. **Security audit** - Run security scans

---

## Related Documentation

- [Production Deployment](./production.md)
- [Secrets Management](./secrets-management.md)
- [Troubleshooting](../runbooks/troubleshooting.md)
- [Security Architecture](../architecture/security.md)
