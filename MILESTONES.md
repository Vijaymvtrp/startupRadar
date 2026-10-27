# Startup Radar India — Milestones & Implementation Tracker

**Repository:** `https://github.com/Vijaymvtrp/startupRadar.git`  
**Specification:** [startup_radar_india_complete_spec_v3.md](./startup_radar_india_complete_spec_v3.md)  
**Database:** Supabase PostgreSQL (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`)  
**Cache / Queue:** Upstash Serverless Redis (`rediss://optimum-starfish-132990.upstash.io:6379`)  
**Current Status:** **5 / 9 Milestones Completed (55% Finished)**  
**Automated Tests:** **28 / 28 E2E Tests Passing (100%)**  
**Last Updated:** 27 October 2026

---

## Milestone Progress Overview

| # | Milestone Name | Scope & Core Features | Status | E2E Test Suite | Git Commit |
|---|---|---|:---:|:---:|:---:|
| **1** | **Foundation, Shared Taxonomy & Startup Profile** | Monorepo structure, 17 industry sectors, Supabase schema, NestJS Auth, Startup Profile, Next.js dark-mode landing, standalone DDL. | ✅ **Completed** | `milestone1.e2e-spec.ts` (5/5 Passed) | `4c502da` |
| **2** | **Source Registry & Background Ingestion Pipeline** | SSRF protection guard, RSS/Sitemap/HTML Cheerio connectors, BullMQ on Upstash Redis, Sources Management Admin API & Web UI. | ✅ **Completed** | `milestone2.e2e-spec.ts` (6/6 Passed) | `e72dcf4` |
| **3** | **Change Detection, Deduplication & Review Queue** | ETag/Last-Modified, HTML sanitization, SHA-256 hash hashing, Canonical draft creation, secondary source linking, Human Review Queue for conflicts, selective LLM extractor. | ✅ **Completed** | `milestone3.e2e-spec.ts` (5/5 Passed) | `730a420` |
| **4** | **Startup Opportunities MVP** | Public Opportunity Search with facet filters (category, stage, industry, central/state gov level, deadline status), Canonical slug detail view with source provenance, Admin Official Gazette Verification & Rejection workflows, Next.js directory & detail pages. | ✅ **Completed** | `milestone4.e2e-spec.ts` (6/6 Passed) | `7c9e10f` |
| **5** | **Startup Perks & Credits MVP** | Official startup credits directory (Cloud, AI/API, Developer tools, SaaS discounts), eligibility criteria checklist, provider verification, Next.js `/perks` directory & detail pages. | ✅ **Completed** | `milestone5.e2e-spec.ts` (6/6 Passed) | Pending Commit |
| **6** | **Founder Accounts, Saved Items & Alerts** | User bookmarks, deadline email notifications, private application status tracking, preference controls. | ⏳ **Next Up** | `milestone6.e2e-spec.ts` | Planned |
| **7** | **Co-Founder Matching MVP** | Founder profiles, skills sought/offered, commitment & stage preferences, mutual-consent connection requests, anti-abuse & privacy controls. | 📋 Pending | `milestone7.e2e-spec.ts` | Planned |
| **8** | **Startup Intelligence & Action Engine** | Deterministic profile-based opportunity/perk recommendations, explainable match rationale, missing-eligibility flags, next-step suggestions. | 📋 Pending | `milestone8.e2e-spec.ts` | Planned |
| **9** | **Production Readiness & Pilot Measurement** | Rate limiting, security audits, source freshness metrics, Docker/Cloud deployment configuration. | 📋 Pending | `milestone9.e2e-spec.ts` | Planned |

---

## Detailed Milestone Logs

### Milestone 1 — Foundation, Shared Taxonomy & Startup Profile
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - Monorepo initialized with npm workspaces: `packages/shared-types`, `apps/api`, `apps/web`.
  - Shared taxonomy: 17 industry sectors, startup stages, business models, and startup needs in `packages/shared-types/src/index.ts`.
  - Prisma models & PostgreSQL schema: `users`, `user_profiles`, `startup_profiles`, `startup_profile_industries`, `startup_profile_needs`, `audit_logs`.
  - NestJS Modules: `AuthModule` (bcrypt + JWT), `TaxonomyModule`, `StartupProfileModule`, `HealthModule`.
  - Standalone SQL DDL: `database/schema.sql` (in sync with Prisma).
  - Web UI: Next.js 14 responsive landing page (`apps/web/src/app/page.tsx`).
  - Tests: `apps/api/test/milestone1.e2e-spec.ts` (5/5 passed).

### Milestone 2 — Source Registry & Ingestion Pipeline
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: `sources`, `source_configs`, `source_runs`, `source_checks`.
  - SSRF Security Validator: `apps/api/src/connectors/ssrf.guard.ts` (blocks private IP ranges, localhost, and AWS/Cloud metadata IPs `169.254.169.254`).
  - Connectors: `RssConnector`, `SitemapConnector`, `HtmlConnector` (Cheerio), `ConnectorRegistryService`.
  - Asynchronous Queue: BullMQ with Upstash Serverless Redis integration (`apps/api/src/queue/`).
  - Admin Web UI: `apps/web/src/app/admin/sources/page.tsx` for adding, testing, and managing sources.
  - Tests: `apps/api/test/milestone2.e2e-spec.ts` (6/6 passed).

### Milestone 3 — Change Detection, Deduplication & Data Quality
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: `opportunities`, `opportunity_sources`, `review_queue_items`.
  - Content Normalization: Strip volatile scripts, banners, dynamic footers, generating SHA-256 hashes (`ChangeDetectionService`).
  - Deduplication Engine: Canonical record creation, multi-source provenance linking (`DeduplicationService`).
  - Data Quality Guard: Conflicting deadlines (>1 day diff) automatically routed to human `ReviewQueueItem` with reason `CONFLICTING_DATA`.
  - Human Verification Queue: `ReviewQueueService` and `ReviewQueueController` (`/api/v1/admin/review-queue`).
  - Tests: `apps/api/test/milestone3.e2e-spec.ts` (5/5 passed).

### Milestone 4 — Startup Opportunities MVP
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: Added `DeliveryMode` (`ONLINE`, `OFFLINE`, `HYBRID`, `NOT_SPECIFIED`), `OpportunityEligibilityCriterion` table, official notification & verification columns.
  - Public Search API: `GET /api/v1/opportunities` with keyword search, category, government level, benefit type, delivery mode, stage, industry, and deadline status filters.
  - Canonical Slug API: `GET /api/v1/opportunities/:slug` with full source provenance and eligibility criteria checklist.
  - Admin Verification API: `POST /api/v1/admin/opportunities/:id/verify` (records official gazette notice, notes, and writes audit log).
  - Admin Rejection API: `POST /api/v1/admin/opportunities/:id/reject`.
  - Web UI:
    - `/opportunities` — Directory with live search, filters, grant badges, and deadline indicators.
    - `/opportunities/[slug]` — Canonical detail view with official portal CTA, gazette guidelines link, and data integrity banner.
  - Tests: `apps/api/test/milestone4.e2e-spec.ts` (6/6 passed).
  - Full Sequential Suite: 22/22 passed across Milestones 1-4.

### Milestone 5 — Startup Perks & Credits MVP
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: Added `perk_providers`, `startup_perk_programs`, `perk_eligibility_criteria`, `perk_sources`, and enums `PerkBenefitType`, `PerkProgramStatus`.
  - Public Search API: `GET /api/v1/perks` with keyword search, benefitType, provider, stage, country, and status filters.
  - Canonical Slug API: `GET /api/v1/perks/:slug` with provider information, eligibility criteria, and primary source links.
  - Admin Verification API: `POST /api/v1/admin/perks/:id/verify` (records official verification notes and writes audit log).
  - Admin Rejection API: `POST /api/v1/admin/perks/:id/reject`.
  - Web UI:
    - `/perks` — Perks Directory with category pills (Cloud Credits, AI Credits, Dev Tools, SaaS Discounts), search, and value highlights.
    - `/perks/[slug]` — Canonical detail view with "Apply on Official Portal" CTA, terms guidelines, and data integrity banner.
  - Tests: `apps/api/test/milestone5.e2e-spec.ts` (6/6 passed).
  - Full Sequential Suite: **28/28 passed across Milestones 1-5**.

---

## How to Run Tests
From the root directory:
```powershell
# Run all Milestone E2E tests in sequence
npm.cmd --prefix apps/api run test:e2e -- --runInBand milestone
```

