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
