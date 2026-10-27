-- =====================================================================
-- Startup Radar India — Complete PostgreSQL DDL Schema (Milestone 1)
-- Description: DDL definitions for shared taxonomy, users, profiles,
--              startup profiles, industries, needs, and audit logs.
-- =====================================================================

-- -------------------------------------------------------------
-- 1. Custom PostgreSQL Enum Types
-- -------------------------------------------------------------

CREATE TYPE "UserRole" AS ENUM (
    'PUBLIC_VISITOR',
    'FOUNDER',
    'ORGANIZER',
    'ADMIN'
);

CREATE TYPE "StartupStage" AS ENUM (
    'EXPLORING_IDEA',
    'RESEARCH',
    'PROTOTYPE',
    'MVP',
    'FIRST_CUSTOMERS',
    'REVENUE_GENERATING',
    'SCALING'
);

CREATE TYPE "BusinessModel" AS ENUM (
    'B2B',
    'B2C',
    'D2C',
    'MARKETPLACE',
    'MANUFACTURING',
    'SERVICES',
    'SUBSCRIPTION',
    'DEEP_TECH_RESEARCH',
    'SOCIAL_ENTERPRISE',
    'OTHER'
);

CREATE TYPE "IndustrySector" AS ENUM (
    'AGRICULTURE',
    'HEALTHCARE_LIFESCIENCES',
    'MANUFACTURING',
    'FOOD_BEVERAGE',
    'EDUCATION_EDTECH',
    'RETAIL_ECOMMERCE',
    'CONSTRUCTION_REAL_ESTATE',
    'LOGISTICS_SUPPLY_CHAIN',
    'CLEAN_ENERGY_CLIMATE',
    'SOFTWARE_IT',
    'BIOTECH_PHARMA',
    'FINTECH',
    'DEFENSE_AEROSPACE',
    'MEDIA_ENTERTAINMENT',
    'CONSUMER_GOODS',
    'SERVICES_CONSULTING',
    'OTHER'
);

CREATE TYPE "StartupNeed" AS ENUM (
    'FUNDING',
    'GRANTS',
    'TENDERS',
    'INCUBATION',
    'CLOUD_CREDITS',
    'SOFTWARE_TOOLS',
    'FACILITIES_EQUIPMENT',
    'TESTING_CERTIFICATION',
    'CO_FOUNDER',
    'PILOT_OPPORTUNITIES',
    'CUSTOMERS',
    'PARTNERSHIPS',
    'SUPPLIERS',
    'DISTRIBUTION',
    'EXPORT_SUPPORT',
    'OTHER'
);

CREATE TYPE "VerificationStatus" AS ENUM (
    'PENDING',
    'NEEDS_REVIEW',
    'OFFICIALLY_VERIFIED',
    'UNABLE_TO_VERIFY',
    'EXPIRED',
    'CLOSED',
    'CANCELLED'
);

CREATE TYPE "PublicationStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED'
);

-- -------------------------------------------------------------
-- 2. Tables
-- -------------------------------------------------------------

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FOUNDER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- User profiles table
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "location" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- Startup profiles table (Industry-agnostic, supports idea-stage without prior registration)
CREATE TABLE IF NOT EXISTS "startup_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupName" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "primaryIndustry" "IndustrySector" NOT NULL,
    "businessModel" "BusinessModel" NOT NULL DEFAULT 'B2B',
    "stage" "StartupStage" NOT NULL DEFAULT 'EXPLORING_IDEA',
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "stateCode" TEXT,
    "city" TEXT,
    "isRegisteredCompany" BOOLEAN NOT NULL DEFAULT false,
    "dpiitRecognized" BOOLEAN NOT NULL DEFAULT false,
    "msmeRegistered" BOOLEAN NOT NULL DEFAULT false,
    "teamSizeBand" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_profiles_pkey" PRIMARY KEY ("id")
);

-- Startup profile secondary industries table (Multi-select)
CREATE TABLE IF NOT EXISTS "startup_profile_industries" (
    "id" TEXT NOT NULL,
    "startupProfileId" TEXT NOT NULL,
    "industry" "IndustrySector" NOT NULL,

    CONSTRAINT "startup_profile_industries_pkey" PRIMARY KEY ("id")
);

-- Startup profile needs table (Multi-select)
CREATE TABLE IF NOT EXISTS "startup_profile_needs" (
    "id" TEXT NOT NULL,
    "startupProfileId" TEXT NOT NULL,
    "need" "StartupNeed" NOT NULL,

    CONSTRAINT "startup_profile_needs_pkey" PRIMARY KEY ("id")
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- -------------------------------------------------------------
-- 3. Indexes & Constraints
-- -------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "startup_profiles_userId_key" ON "startup_profiles"("userId");

CREATE INDEX IF NOT EXISTS "startup_profiles_primaryIndustry_idx" ON "startup_profiles"("primaryIndustry");
CREATE INDEX IF NOT EXISTS "startup_profiles_stage_idx" ON "startup_profiles"("stage");
CREATE INDEX IF NOT EXISTS "startup_profiles_countryCode_stateCode_idx" ON "startup_profiles"("countryCode", "stateCode");

CREATE UNIQUE INDEX IF NOT EXISTS "startup_profile_industries_startupProfileId_industry_key" 
ON "startup_profile_industries"("startupProfileId", "industry");

CREATE UNIQUE INDEX IF NOT EXISTS "startup_profile_needs_startupProfileId_need_key" 
ON "startup_profile_needs"("startupProfileId", "need");

CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

-- -------------------------------------------------------------
-- 4. Foreign Keys
-- -------------------------------------------------------------

ALTER TABLE "user_profiles" 
DROP CONSTRAINT IF EXISTS "user_profiles_userId_fkey",
ADD CONSTRAINT "user_profiles_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "startup_profiles" 
DROP CONSTRAINT IF EXISTS "startup_profiles_userId_fkey",
ADD CONSTRAINT "startup_profiles_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "startup_profile_industries" 
DROP CONSTRAINT IF EXISTS "startup_profile_industries_startupProfileId_fkey",
ADD CONSTRAINT "startup_profile_industries_startupProfileId_fkey" 
FOREIGN KEY ("startupProfileId") REFERENCES "startup_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "startup_profile_needs" 
DROP CONSTRAINT IF EXISTS "startup_profile_needs_startupProfileId_fkey",
ADD CONSTRAINT "startup_profile_needs_startupProfileId_fkey" 
FOREIGN KEY ("startupProfileId") REFERENCES "startup_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" 
DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey",
ADD CONSTRAINT "audit_logs_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
-- Milestone 2: Source Registry & Ingestion Pipeline DDL
-- =============================================================

CREATE TYPE "SourceCollectionMethod" AS ENUM (
    'AUTO_DETECT',
    'API',
    'RSS',
    'SITEMAP',
    'HTML'
);

CREATE TYPE "SourceHealthStatus" AS ENUM (
    'NEW',
    'CONFIGURING',
    'HEALTHY',
    'WARNING',
    'FAILED',
    'PAUSED',
    'UNSUPPORTED'
);

CREATE TYPE "SourcePriority" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);

CREATE TYPE "SourceRunStatus" AS ENUM (
    'QUEUED',
    'RUNNING',
    'SUCCESS',
    'PARTIAL_SUCCESS',
    'FAILED'
);

CREATE TABLE IF NOT EXISTS "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "allowedDomains" TEXT[] NOT NULL,
    "category" "OpportunityCategory" NOT NULL DEFAULT 'GOVERNMENT_SCHEME',
    "collectionMethod" "SourceCollectionMethod" NOT NULL DEFAULT 'AUTO_DETECT',
    "priority" "SourcePriority" NOT NULL DEFAULT 'MEDIUM',
    "checkFrequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "healthStatus" "SourceHealthStatus" NOT NULL DEFAULT 'NEW',
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 10,
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "stateCode" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "source_configs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "apiHeaders" JSONB,
    "feedUrl" TEXT,
    "sitemapUrl" TEXT,
    "htmlListingSelector" TEXT,
    "htmlTitleSelector" TEXT,
    "htmlDeadlineSelector" TEXT,
    "htmlLinkSelector" TEXT,
    "htmlDescSelector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "source_runs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "SourceRunStatus" NOT NULL DEFAULT 'RUNNING',
    "itemsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "itemsExtracted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "source_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "source_checks" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "contentHash" TEXT,
    "statusCode" INTEGER,
    "checkStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedAt" TIMESTAMP(3),

    CONSTRAINT "source_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "source_configs_sourceId_key" ON "source_configs"("sourceId");
CREATE INDEX IF NOT EXISTS "sources_healthStatus_idx" ON "sources"("healthStatus");
CREATE INDEX IF NOT EXISTS "sources_isEnabled_idx" ON "sources"("isEnabled");
CREATE INDEX IF NOT EXISTS "sources_collectionMethod_idx" ON "sources"("collectionMethod");
CREATE INDEX IF NOT EXISTS "source_runs_sourceId_idx" ON "source_runs"("sourceId");
CREATE INDEX IF NOT EXISTS "source_runs_status_idx" ON "source_runs"("status");
CREATE INDEX IF NOT EXISTS "source_checks_sourceId_url_idx" ON "source_checks"("sourceId", "url");

ALTER TABLE "source_configs" 
DROP CONSTRAINT IF EXISTS "source_configs_sourceId_fkey",
ADD CONSTRAINT "source_configs_sourceId_fkey" 
FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "source_runs" 
DROP CONSTRAINT IF EXISTS "source_runs_sourceId_fkey",
ADD CONSTRAINT "source_runs_sourceId_fkey" 
FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "source_checks" 
DROP CONSTRAINT IF EXISTS "source_checks_sourceId_fkey",
ADD CONSTRAINT "source_checks_sourceId_fkey" 
FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- Milestone 3: Canonical Opportunities, Provenance & Review DDL
-- =============================================================

CREATE TYPE "GovernmentLevel" AS ENUM (
    'CENTRAL',
    'STATE',
    'LOCAL',
    'PUBLIC_SECTOR',
    'NOT_APPLICABLE'
);

CREATE TYPE "OpportunityBenefitType" AS ENUM (
    'GRANT',
    'SUBSIDY',
    'LOAN',
    'EQUITY_INVESTMENT',
    'INCUBATION_SUPPORT',
    'PROCUREMENT',
    'OTHER'
);

CREATE TYPE "ReviewReason" AS ENUM (
    'SUSPECTED_DUPLICATE',
    'CONFLICTING_DATA',
    'UNVERIFIED_GOV_CLAIM',
    'EXTRACTION_UNCERTAINTY'
);

CREATE TYPE "ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE "DeliveryMode" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'HYBRID',
    'NOT_SPECIFIED'
);

CREATE TABLE IF NOT EXISTS "opportunities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "organizer" TEXT,
    "category" "OpportunityCategory" NOT NULL DEFAULT 'GOVERNMENT_SCHEME',
    "governmentLevel" "GovernmentLevel" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "departmentName" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "stateCode" TEXT,
    "city" TEXT,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "startupStages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "benefitType" "OpportunityBenefitType" NOT NULL DEFAULT 'GRANT',
    "benefitAmountMin" DOUBLE PRECISION,
    "benefitAmountMax" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "sourcePublishedAt" TIMESTAMP(3),
    "eventStartAt" TIMESTAMP(3),
    "eventEndAt" TIMESTAMP(3),
    "applicationOpenAt" TIMESTAMP(3),
    "applicationDeadline" TIMESTAMP(3),
    "officialApplicationUrl" TEXT,
    "officialNotificationUrl" TEXT,
    "eligibilitySummary" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "opportunity_eligibility_criteria" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "criterionType" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_eligibility_criteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "opportunity_sources" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "contentHash" TEXT,
    "isPrimarySource" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "review_queue_items" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "reason" "ReviewReason" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerNotes" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "opportunity_eligibility_criteria_opportunityId_idx" 
ON "opportunity_eligibility_criteria"("opportunityId");

ALTER TABLE "opportunity_eligibility_criteria" 
DROP CONSTRAINT IF EXISTS "opportunity_eligibility_criteria_opportunityId_fkey",
ADD CONSTRAINT "opportunity_eligibility_criteria_opportunityId_fkey" 
FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "opportunities_slug_key" ON "opportunities"("slug");
CREATE INDEX IF NOT EXISTS "opportunities_category_idx" ON "opportunities"("category");
CREATE INDEX IF NOT EXISTS "opportunities_verificationStatus_idx" ON "opportunities"("verificationStatus");
CREATE INDEX IF NOT EXISTS "opportunities_publicationStatus_idx" ON "opportunities"("publicationStatus");
CREATE INDEX IF NOT EXISTS "opportunities_applicationDeadline_idx" ON "opportunities"("applicationDeadline");
CREATE INDEX IF NOT EXISTS "opportunities_countryCode_stateCode_idx" ON "opportunities"("countryCode", "stateCode");

CREATE UNIQUE INDEX IF NOT EXISTS "opportunity_sources_opportunityId_sourceUrl_key" 
ON "opportunity_sources"("opportunityId", "sourceUrl");
CREATE INDEX IF NOT EXISTS "opportunity_sources_sourceUrl_idx" ON "opportunity_sources"("sourceUrl");

CREATE INDEX IF NOT EXISTS "review_queue_items_status_idx" ON "review_queue_items"("status");
CREATE INDEX IF NOT EXISTS "review_queue_items_reason_idx" ON "review_queue_items"("reason");

ALTER TABLE "opportunity_sources" 
DROP CONSTRAINT IF EXISTS "opportunity_sources_opportunityId_fkey",
ADD CONSTRAINT "opportunity_sources_opportunityId_fkey" 
FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opportunity_sources" 
DROP CONSTRAINT IF EXISTS "opportunity_sources_sourceId_fkey",
ADD CONSTRAINT "opportunity_sources_sourceId_fkey" 
FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_queue_items" 
DROP CONSTRAINT IF EXISTS "review_queue_items_opportunityId_fkey",
ADD CONSTRAINT "review_queue_items_opportunityId_fkey" 
FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- Milestone 5: Startup Perks & Credits DDL
-- =============================================================

CREATE TYPE "PerkBenefitType" AS ENUM (
    'CLOUD_CREDITS',
    'AI_API_CREDITS',
    'DEVELOPER_TOOL',
    'FREE_TIER',
    'FREE_TRIAL',
    'DISCOUNT',
    'BUSINESS_SOFTWARE',
    'INFRASTRUCTURE',
    'FACILITY_ACCESS',
    'PARTNER_SERVICE',
    'OTHER'
);

CREATE TYPE "PerkProgramStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'WAITLIST',
    'CLOSED'
);

CREATE TABLE IF NOT EXISTS "perk_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialDomain" TEXT NOT NULL,
    "providerType" TEXT NOT NULL DEFAULT 'OTHER',
    "logoUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perk_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "startup_perk_programs" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "description" TEXT,
    "officialProgramUrl" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "benefitType" "PerkBenefitType" NOT NULL DEFAULT 'CLOUD_CREDITS',
    "statedValueAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "eligibleCountries" TEXT[] NOT NULL DEFAULT ARRAY['IN']::TEXT[],
    "eligibleStages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "PerkProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startup_perk_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "perk_eligibility_criteria" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "criterionType" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perk_eligibility_criteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "perk_sources" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "contentHash" TEXT,
    "isPrimarySource" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perk_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "perk_providers_name_key" ON "perk_providers"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "startup_perk_programs_slug_key" ON "startup_perk_programs"("slug");
CREATE INDEX IF NOT EXISTS "startup_perk_programs_benefitType_idx" ON "startup_perk_programs"("benefitType");
CREATE INDEX IF NOT EXISTS "startup_perk_programs_status_idx" ON "startup_perk_programs"("status");
CREATE INDEX IF NOT EXISTS "startup_perk_programs_verificationStatus_idx" ON "startup_perk_programs"("verificationStatus");
CREATE INDEX IF NOT EXISTS "startup_perk_programs_publicationStatus_idx" ON "startup_perk_programs"("publicationStatus");

CREATE INDEX IF NOT EXISTS "perk_eligibility_criteria_programId_idx" ON "perk_eligibility_criteria"("programId");
CREATE UNIQUE INDEX IF NOT EXISTS "perk_sources_programId_sourceUrl_key" ON "perk_sources"("programId", "sourceUrl");
CREATE INDEX IF NOT EXISTS "perk_sources_sourceUrl_idx" ON "perk_sources"("sourceUrl");

ALTER TABLE "startup_perk_programs" 
DROP CONSTRAINT IF EXISTS "startup_perk_programs_providerId_fkey",
ADD CONSTRAINT "startup_perk_programs_providerId_fkey" 
FOREIGN KEY ("providerId") REFERENCES "perk_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perk_eligibility_criteria" 
DROP CONSTRAINT IF EXISTS "perk_eligibility_criteria_programId_fkey",
ADD CONSTRAINT "perk_eligibility_criteria_programId_fkey" 
FOREIGN KEY ("programId") REFERENCES "startup_perk_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perk_sources" 
DROP CONSTRAINT IF EXISTS "perk_sources_programId_fkey",
ADD CONSTRAINT "perk_sources_programId_fkey" 
FOREIGN KEY ("programId") REFERENCES "startup_perk_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;



