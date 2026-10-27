# Startup Radar India — Milestones & Implementation Tracker

**Repository:** `https://github.com/Vijaymvtrp/startupRadar.git`  
**Specification:** [startup_radar_india_complete_spec_v3.md](./startup_radar_india_complete_spec_v3.md)  
**Database:** Supabase PostgreSQL (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`)  
**Cache / Queue:** Upstash Serverless Redis (`rediss://optimum-starfish-132990.upstash.io:6379`)  
**Current Status:** **8 / 9 Milestones Completed (89% Finished)**  
**Automated Tests:** **46 / 46 E2E Tests Passing (100% Green)**  
**Last Updated:** 27 October 2026

---

## Milestone Progress Overview

| # | Milestone Name | Scope & Core Features | Status | E2E Test Suite | Git Commit |
|---|---|---|:---:|:---:|:---:|
| **1** | **Foundation, Shared Taxonomy & Startup Profile** | Monorepo structure, 17 industry sectors, Supabase schema, NestJS Auth, Startup Profile, Next.js dark-mode landing, standalone DDL. | ✅ **Completed** | `milestone1.e2e-spec.ts` (5/5 Passed) | `4c502da` |
| **2** | **Source Registry & Background Ingestion Pipeline** | SSRF protection guard, RSS/Sitemap/HTML Cheerio connectors, BullMQ on Upstash Redis, Sources Management Admin API & Web UI. | ✅ **Completed** | `milestone2.e2e-spec.ts` (6/6 Passed) | `e72dcf4` |
| **3** | **Change Detection, Deduplication & Review Queue** | ETag/Last-Modified, HTML sanitization, SHA-256 hash hashing, Canonical draft creation, secondary source linking, Human Review Queue for conflicts, selective LLM extractor. | ✅ **Completed** | `milestone3.e2e-spec.ts` (5/5 Passed) | `730a420` |
| **4** | **Startup Opportunities MVP** | Public Opportunity Search with facet filters (category, stage, industry, central/state gov level, deadline status), Canonical slug detail view with source provenance, Admin Official Gazette Verification & Rejection workflows, Next.js directory & detail pages. | ✅ **Completed** | `milestone4.e2e-spec.ts` (6/6 Passed) | `7c9e10f` |
| **5** | **Startup Perks & Credits MVP** | Official startup credits directory (Cloud, AI/API, Developer tools, SaaS discounts), eligibility criteria checklist, provider verification, Next.js `/perks` directory & detail pages. | ✅ **Completed** | `milestone5.e2e-spec.ts` (6/6 Passed) | `3df5745` |
| **6** | **Founder Accounts, Saved Items & Alerts** | User bookmarks, deadline email notifications, private application status tracking, preference controls. | ✅ **Completed** | `milestone6.e2e-spec.ts` (6/6 Passed) | `5ba495e` |
| **7** | **Co-Founder Matching MVP** | Founder profiles, skills sought/offered, commitment & stage preferences, mutual-consent connection requests, anti-abuse & privacy controls. | ✅ **Completed** | `milestone7.e2e-spec.ts` (6/6 Passed) | `c7d5c5c` |
| **8** | **Startup Intelligence & Action Engine** | Deterministic profile-based opportunity/perk recommendations, explainable match rationale, missing-eligibility flags, next-step suggestions, founder feedback & dismissal controls. | ✅ **Completed** | `milestone8.e2e-spec.ts` (6/6 Passed) | Pending Commit |
| **9** | **Production Readiness & Pilot Measurement** | Rate limiting, security audits, source freshness metrics, Docker/Cloud deployment configuration. | ⏳ **Next Up** | `milestone9.e2e-spec.ts` | Planned |

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
  - Full Sequential Suite: 28/28 passed across Milestones 1-5.

### Milestone 6 — Founder Accounts, Saved Items & Deadline Alerts
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: Added `user_preferences`, `saved_opportunities`, `saved_perks`, `application_tracking`, `user_alert_notifications`, and enums `AlertFrequency`, `ApplicationStatus`.
  - Saved Opportunities & Perks APIs:
    - `GET /api/v1/me/saved-opportunities`, `POST /api/v1/me/saved-opportunities`, `DELETE /api/v1/me/saved-opportunities/:opportunityId` (idempotent duplicate prevention).
    - `GET /api/v1/me/saved-perks`, `POST /api/v1/me/saved-perks`, `DELETE /api/v1/me/saved-perks/:perkProgramId`.
  - Private Application Tracking API:
    - `GET /api/v1/me/application-tracking`, `POST /api/v1/me/application-tracking`, `PATCH /api/v1/me/application-tracking/:id`, `DELETE /api/v1/me/application-tracking/:id`.
    - Strict user ownership isolation: User B cannot access or update User A's private notes (403 Forbidden).
  - Notification Preferences & Unsubscribe:
    - `GET /api/v1/me/preferences`, `PUT /api/v1/me/preferences`.
  - Deadline Alerts Engine:
    - `DeadlineAlertsService` with approaching deadline detection (7-day / 48-hour windows), follow-up milestone reminders, cryptographic alert deduplication via `user_alert_notifications`, and unsubscribe alert suppression.
    - `POST /api/v1/admin/alerts/process-deadlines`.
  - Account Deletion & GDPR Privacy:
    - `DELETE /api/v1/me/account` (cascading personal data cleanup).
  - Web UI:
    - `/dashboard/saved` — Tabbed saved opportunities and perks with deadline badges and alert toggle.
    - `/dashboard/applications` — Confidential application tracker with status stages, private notes editor, and official portal CTAs.
  - Tests: `apps/api/test/milestone6.e2e-spec.ts` (6/6 passed).
  - Full Sequential Suite: 34/34 passed across Milestones 1-6.

### Milestone 7 — Co-Founder Matching MVP
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: Added `founder_profiles`, `founder_skills`, `founder_interests`, `connection_requests`, `blocked_users`, `profile_reports`, and enums `CommitmentPreference`, `WorkLocationPreference`, `ConnectionRequestStatus`, `FounderProfileStatus`, `SkillType`, `SkillProficiency`.
  - Profile Management APIs:
    - `POST /api/v1/founders/me`, `GET /api/v1/founders/me`, `GET /api/v1/founders/:id`.
    - Strict privacy: Private contact details (`contactEmail`, `contactPhone`) are shielded from public discovery and only revealed upon mutual connection consent.
  - Public Discovery API:
    - `GET /api/v1/founders` with keyword search, sector, stage, commitment, location style, city, and skill filters; automatically excludes blocked users.
  - Explainable Matching Engine:
    - `GET /api/v1/founders/me/recommendations` calculating deterministic match scores (0–100%) with explainable bullet points (complementary skills, sector alignment, commitment synergy, and stage compatibility; no LLM hallucination).
  - Consent-Based Connection Requests:
    - `POST /api/v1/founders/connection-requests`, `GET /api/v1/founders/connection-requests`, `PATCH /api/v1/founders/connection-requests/:id/respond`, `POST /api/v1/founders/connection-requests/:id/withdraw`.
  - Abuse Prevention & Moderation:
    - `POST /api/v1/founders/:targetUserId/block`, `POST /api/v1/founders/:profileId/report`.
  - Web UI:
    - `/co-founders` — Co-Founders Directory with live search, sector badges, skill pills, "Connect" modal, and "Smart Recommendations" tab.
  - Tests: `apps/api/test/milestone7.e2e-spec.ts` (6/6 passed).
  - Full Sequential Suite: **40/40 passed across Milestones 1-7 (100% Green)**.

### Milestone 8 — Startup Intelligence & Action Engine MVP
- **Status:** Completed & Live Verified
- **Key Deliverables:**
  - DB Schema: Added `recommendation_runs`, `recommendations`, `recommendation_feedback` tables and enums `EligibilityAssessment` (`LIKELY_MATCH`, `POTENTIAL_ISSUE`, `NEEDS_INFORMATION`, `NOT_ELIGIBLE`), `RecommendationTargetType` (`OPPORTUNITY`, `PERK`), `RecommendationFeedback` (`RELEVANT`, `NOT_RELEVANT`, `SAVED`, `DISMISSED`). Live Supabase DB migrated and synchronized with `database/schema.sql`.
  - Deterministic Recommendation Engine (`IntelligenceService`):
    - Multi-factor deterministic scoring rule (0–100%) evaluating primary sector match (+30), secondary sector match (+20), startup stage fit (+25), declared need alignment (+20/35), and eligibility checklists.
    - Zero hallucination: Never claims guaranteed approval; provides transparent rationale strings for each match factor.
    - Missing Proof Detection: Automatically identifies prerequisites (e.g., DPIIT recognition, MSME Udyam registration, Incorporation) and flags them as `NEEDS_INFORMATION` with clear, actionable preparation steps.
  - Intelligence APIs:
    - `POST /api/v1/recommendations/generate` — Evaluates canonical published opportunities and active perk programs against the founder's startup profile.
    - `GET /api/v1/recommendations` — Lists prioritized recommendations with target metadata, benefit highlights, and rationale.
    - `GET /api/v1/recommendations/summary` — Returns dashboard overview with likely matches, needs-info count, missing profile prerequisites, and top next-step actions.
    - `POST /api/v1/recommendations/:id/feedback` — Captures founder relevance feedback and comments to evaluate recommendation accuracy.
    - `POST /api/v1/recommendations/:id/dismiss` — Hides dismissed recommendations from the active feed.
  - Web UI:
    - `/dashboard` — Founder Intelligence & Action Dashboard with KPI counters, Urgent Action Items banner, Missing Prerequisites checklist, and Opportunity & Perk cards with feedback and dismiss controls.
  - Tests: `apps/api/test/milestone8.e2e-spec.ts` (6/6 passed).
  - Full Sequential Suite: **46/46 passed across Milestones 1-8 (100% Green)**.

---

## How to Run Tests
From the root directory:
```powershell
# Run all Milestone E2E tests in sequence
npm.cmd --prefix apps/api run test:e2e -- --runInBand milestone1 milestone2 milestone3 milestone4 milestone5 milestone6 milestone7 milestone8
```


