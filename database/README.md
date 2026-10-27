# Startup Radar India — Database Architecture & DDL Scripts

This directory contains standalone, production-ready PostgreSQL DDL scripts for Startup Radar India.

## Directory Structure

```text
database/
  ├── schema.sql           # Complete, idempotent DDL (Enums, Tables, Indexes, FKs)
  └── README.md            # Execution guide and architecture details
```

## How to Apply These DDL Scripts

### Option A: Using Supabase Dashboard (Recommended for quick direct setup)
1. Open your project on [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in the left sidebar.
3. Paste the contents of `database/schema.sql`.
4. Click **Run**. All enums, tables, indexes, and constraints will be created cleanly.

### Option B: Using Prisma (Automated Migrations)
From the root workspace, run:
```bash
npm run --workspace=@startup-radar/api prisma:push
```
This automatically inspects `apps/api/prisma/schema.prisma` and applies changes to the configured database.

## Architecture Highlights
- **Normalized Schema:** Avoids arbitrary string dumps for multi-value fields (e.g., separate lookup tables for `startup_profile_industries` and `startup_profile_needs`).
- **Data Quality:** Uses Postgres `ENUM` types for strict data validation on industry sectors, startup stages, business models, and opportunity statuses.
- **Audit Logs:** Dedicated `audit_logs` table tracking user modifications and administrative actions.
- **Indexes:** Multi-column and single-column B-tree indexes for fast querying by industry, stage, and geography (state/city).
