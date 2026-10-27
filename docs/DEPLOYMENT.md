# Startup Radar India — Production Deployment & Runbook

This runbook outlines procedures for deploying, maintaining, and monitoring **Startup Radar India** across local environments, Docker containers, and cloud PaaS (e.g., Supabase + Upstash + AWS/Render/DigitalOcean/GCP).

---

## 1. Environment Architecture

```
                    ┌────────────────────────┐
                    │      Cloudflare /      │
                    │   Reverse Proxy / CDN  │
                    └───────────┬────────────┘
                                │
               ┌────────────────┴────────────────┐
               │                                 │
     (Port 3000: Next.js)               (Port 4000: NestJS API)
    ┌──────────────────────┐           ┌──────────────────────┐
    │ @startup-radar/web   │           │  @startup-radar/api  │
    └──────────────────────┘           └──────────┬───────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────┐
                 │                                                 │
      ┌──────────▼──────────┐                           ┌──────────▼──────────┐
      │     Supabase        │                           │     Upstash         │
      │ PostgreSQL (Port 5432)                          │ Redis (BullMQ Queue)│
      └─────────────────────┘                           └─────────────────────┘
```

---

## 2. Environment Variables Checklist

Ensure these variables are provisioned in your hosting environment (`.env` or Cloud Secrets):

| Variable | Description | Example / Production Format |
|---|---|---|
| `PORT` | API listen port | `4000` |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | Supabase Postgres Pooler | `postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `REDIS_URL` | Upstash Redis connection string | `rediss://default:[token]@optimum-starfish-132990.upstash.io:6379` |
| `JWT_SECRET` | High-entropy authentication secret | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for frontend | `https://api.startupradar.in/api/v1` |

---

## 3. Database Migration & Initialization

Apply schema changes directly using Prisma or the standalone DDL:

```powershell
# 1. Generate Prisma Client
npx.cmd prisma generate --schema=apps/api/prisma/schema.prisma

# 2. Push schema to Supabase Postgres
npx.cmd prisma db push --schema=apps/api/prisma/schema.prisma

# 3. Alternatively, execute raw DDL in Supabase SQL Editor:
# database/schema.sql
```

---

## 4. Docker Deployment

### 4.1 Running via Docker Compose
To boot the full stack with local containers:
```bash
docker compose -f infra/docker-compose.yml up -d --build
```

### 4.2 Building Production Containers Individually
```bash
# Build API container
docker build -f apps/api/Dockerfile -t startup-radar-api:latest .

# Build Web container
docker build -f apps/web/Dockerfile -t startup-radar-web:latest .
```

---

## 5. Health Checks & Observability

- **API Health Check**: `GET /api/v1/health`
  Returns process status, service name, timestamp, and live database round-trip latency.
- **Operational Metrics**: `GET /api/v1/metrics`
  Returns real-time indicators:
  - Source freshness rate (% of sources checked in the last 24h)
  - Opportunities count, verification rate, and pending review queue items
  - Perks count and active offers
  - Co-founder matching statistics and mutual connection rate
  - Recommendation engine feedback distribution and quality score
  - Process uptime and memory heap usage

---

## 6. Security & Rate Limiting Runbook

1. **Security Headers**: All API responses automatically include:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `Referrer-Policy: strict-origin-when-cross-origin`
2. **Rate Limiting**: Public endpoints enforce sliding-window limits per IP (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). If exceeded, HTTP `429 Too Many Requests` is returned with `Retry-After` headers.
3. **SSRF Protection**: Connectors strictly validate URLs via `ssrf.guard.ts` preventing scraping against loopback, private RFC-1918 subnets, and AWS/Cloud metadata IPs (`169.254.169.254`).
