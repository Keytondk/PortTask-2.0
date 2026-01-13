# Navo Maritime Platform - Deployment Guide

## Quick Start (First Deployment)

### Prerequisites

- Node.js 18+
- pnpm 8+
- Railway CLI: `npm i -g @railway/cli`
- Vercel CLI: `npm i -g vercel`

### Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy the connection string from Settings > Database
3. Note the `anon` and `service_role` keys from Settings > API

### Step 2: Set Up Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create a Redis database
2. Copy the Redis URL

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
# Required:
#   - DATABASE_URL (from Supabase)
#   - REDIS_URL (from Upstash)
#   - JWT_SECRET (run: openssl rand -base64 32)
```

### Step 4: Initialize Database

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed demo data
pnpm db:seed
```

### Step 5: Deploy Backend (Railway)

```bash
# Login to Railway
railway login

# Set up Railway projects
./scripts/railway-setup.sh

# Deploy services
./scripts/deploy.sh
```

### Step 6: Deploy Frontend (Vercel)

```bash
# Login to Vercel
vercel login

# Deploy each app
cd apps/key && vercel --prod
cd apps/portal && vercel --prod
cd apps/vendor && vercel --prod
```

### Step 7: Configure Environment Variables

**Railway Dashboard** (for each service):
- `DATABASE_URL` - Supabase connection string
- `REDIS_URL` - Upstash Redis URL
- `JWT_SECRET` - Your secret key

**Vercel Dashboard** (for each app):
- `NEXT_PUBLIC_API_URL` - Railway gateway URL
- `NEXT_PUBLIC_WS_URL` - Railway realtime URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐               │
│  │   Key    │  │  Portal   │  │   Vendor   │               │
│  │  (app)   │  │  (portal) │  │  (vendor)  │               │
│  └────┬─────┘  └─────┬─────┘  └─────┬──────┘               │
└───────┼──────────────┼──────────────┼──────────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        Railway                               │
│  ┌───────────┐                                              │
│  │  Gateway  │ ─────────────────────────┐                   │
│  └─────┬─────┘                          │                   │
│        │                                │                   │
│  ┌─────┼─────────────────────────┐      │                   │
│  │     │         ▼               │      ▼                   │
│  │  ┌──┴───┐ ┌───────┐ ┌────────┐│  ┌────────┐             │
│  │  │ Core │ │Vessel │ │Notif.  ││  │Realtime│             │
│  │  └──────┘ └───────┘ └────────┘│  │  (WS)  │             │
│  │                               │  └────────┘             │
│  └───────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────┐
│   Supabase   │  │  Upstash │
│  (Postgres)  │  │  (Redis) │
└──────────────┘  └──────────┘
```

---

## Service URLs

| Service | Local | Production |
|---------|-------|------------|
| Gateway | http://localhost:8080 | https://navo-gateway.up.railway.app |
| Core | http://localhost:8081 | https://navo-core.up.railway.app |
| Vessel | http://localhost:8082 | https://navo-vessel.up.railway.app |
| Realtime | http://localhost:8083 | wss://navo-realtime.up.railway.app |
| Key App | http://localhost:3000 | https://app.navo.io |
| Portal | http://localhost:3001 | https://portal.navo.io |
| Vendor | http://localhost:3002 | https://vendor.navo.io |

---

## Custom Domains

### Vercel

1. Go to Project Settings > Domains
2. Add your domain (e.g., `app.navo.io`)
3. Update DNS records as instructed

### Railway

1. Go to Service Settings > Networking
2. Add custom domain
3. Update DNS CNAME to Railway URL

---

## Estimated Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Supabase | Pro | $25 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| Railway (5 services) | Hobby | ~$25-50 |
| Vercel (3 apps) | Pro | $20 |
| **Total** | | **~$75-100/month** |

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
pnpm db:studio
```

### Service Health Check
```bash
# Check Railway logs
railway logs -s gateway
```

### Build Failures
```bash
# Check Docker build locally
docker build -f services/gateway/Dockerfile .
```
