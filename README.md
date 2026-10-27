# Startup Radar India 🛰️

> **"Discover opportunities. Unlock startup benefits. Find your co-founder. Know your next move."**

An India-first, industry-agnostic platform that helps founders discover verified opportunities, reduce operating costs through official perks, find compatible co-founders, and receive deterministic next-step recommendations.

---

## 📊 Live Implementation Status

We are delivering the platform in 9 structured milestones as defined in [startup_radar_india_complete_spec_v3.md](./startup_radar_india_complete_spec_v3.md).

👉 **For the complete, live milestone completion tracker, see [MILESTONES.md](./MILESTONES.md).**

| Milestone | Name | Status |
|:---:|---|:---:|
| 1 | Foundation, Shared Taxonomy & Startup Profile | ✅ **Completed** (5/5 Tests) |
| 2 | Source Registry & Background Ingestion Pipeline | ✅ **Completed** (6/6 Tests) |
| 3 | Change Detection, Deduplication & Review Queue | ✅ **Completed** (5/5 Tests) |
| 4 | Startup Opportunities MVP | ✅ **Completed** (6/6 Tests) |
| 5 | Startup Perks & Credits MVP | ✅ **Completed** (6/6 Tests) |
| 6 | Founder Accounts, Saved Items & Alerts | ✅ **Completed** (6/6 Tests) |
| 7 | Co-Founder Matching MVP | ⏳ **Next Up** |
| 8 | Startup Intelligence & Action Engine | 📋 Pending |
| 9 | Production Readiness & Pilot Launch | 📋 Pending |

**All 34 E2E tests across Milestones 1–6 are passing (100% test coverage for completed features).**

---

## 🏛️ Architecture & Tech Stack

- **Monorepo:** npm workspaces (`packages/shared-types`, `apps/api`, `apps/web`)
- **Backend API:** NestJS (TypeScript, Modular Monolith)
- **Frontend Web App:** Next.js 14 App Router + TailwindCSS (Dark-Mode Modern UI)
- **Database:** Supabase PostgreSQL (Managed Cloud, Session Pooler IPv4)
- **Queue / Worker:** Upstash Serverless Redis + BullMQ
- **Crawling / Connectors:** Cheerio, RSS/Atom, Sitemap with SSRF Security Guards
- **Data Quality:** Deterministic SHA-256 deduplication, ETag change detection, and human review queue

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm 9+
- Cloud services: Supabase PostgreSQL, Upstash Redis

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Shared Types
```bash
npm --prefix packages/shared-types run build
```

### 4. Database Setup
```bash
npm --prefix apps/api run prisma:push
```

### 5. Run E2E Tests
```bash
npm --prefix apps/api run test:e2e -- --runInBand milestone
```

### 6. Start Development Servers
```bash
# Start NestJS API (port 3001)
npm --prefix apps/api run start:dev

# Start Next.js Web App (port 3000)
npm --prefix apps/web run dev
```

---

## 📄 Database Schema & DDL
The standalone, portable PostgreSQL DDL script is continuously synchronized with Prisma in:
- [`database/schema.sql`](./database/schema.sql)

---

## 📜 License
Private & Proprietary — Developed for Startup Radar India.
