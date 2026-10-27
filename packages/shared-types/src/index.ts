/**
 * Startup Radar India - Shared Taxonomy and Core Types
 * Version: 3.0 (Milestone 1 Baseline)
 */

// -------------------------------------------------------------
// 1. Taxonomy: Startup Stages & Business Models
// -------------------------------------------------------------
export enum StartupStage {
  EXPLORING_IDEA = 'EXPLORING_IDEA',
  RESEARCH = 'RESEARCH',
  PROTOTYPE = 'PROTOTYPE',
  MVP = 'MVP',
  FIRST_CUSTOMERS = 'FIRST_CUSTOMERS',
  REVENUE_GENERATING = 'REVENUE_GENERATING',
  SCALING = 'SCALING',
}

export enum BusinessModel {
  B2B = 'B2B',
  B2C = 'B2C',
  D2C = 'D2C',
  MARKETPLACE = 'MARKETPLACE',
  MANUFACTURING = 'MANUFACTURING',
  SERVICES = 'SERVICES',
  SUBSCRIPTION = 'SUBSCRIPTION',
  DEEP_TECH_RESEARCH = 'DEEP_TECH_RESEARCH',
  SOCIAL_ENTERPRISE = 'SOCIAL_ENTERPRISE',
  OTHER = 'OTHER',
}

// -------------------------------------------------------------
// 2. Taxonomy: Industry Sectors (Industry-Agnostic)
// -------------------------------------------------------------
export enum IndustrySector {
  AGRICULTURE = 'AGRICULTURE',
  HEALTHCARE_LIFESCIENCES = 'HEALTHCARE_LIFESCIENCES',
  MANUFACTURING = 'MANUFACTURING',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  EDUCATION_EDTECH = 'EDUCATION_EDTECH',
  RETAIL_ECOMMERCE = 'RETAIL_ECOMMERCE',
  CONSTRUCTION_REAL_ESTATE = 'CONSTRUCTION_REAL_ESTATE',
  LOGISTICS_SUPPLY_CHAIN = 'LOGISTICS_SUPPLY_CHAIN',
  CLEAN_ENERGY_CLIMATE = 'CLEAN_ENERGY_CLIMATE',
  SOFTWARE_IT = 'SOFTWARE_IT',
  BIOTECH_PHARMA = 'BIOTECH_PHARMA',
  FINTECH = 'FINTECH',
  DEFENSE_AEROSPACE = 'DEFENSE_AEROSPACE',
  MEDIA_ENTERTAINMENT = 'MEDIA_ENTERTAINMENT',
  CONSUMER_GOODS = 'CONSUMER_GOODS',
  SERVICES_CONSULTING = 'SERVICES_CONSULTING',
  OTHER = 'OTHER',
}

// -------------------------------------------------------------
// 3. Taxonomy: Current Needs
// -------------------------------------------------------------
export enum StartupNeed {
  FUNDING = 'FUNDING',
  GRANTS = 'GRANTS',
  TENDERS = 'TENDERS',
  INCUBATION = 'INCUBATION',
  CLOUD_CREDITS = 'CLOUD_CREDITS',
  SOFTWARE_TOOLS = 'SOFTWARE_TOOLS',
  FACILITIES_EQUIPMENT = 'FACILITIES_EQUIPMENT',
  TESTING_CERTIFICATION = 'TESTING_CERTIFICATION',
  CO_FOUNDER = 'CO_FOUNDER',
  PILOT_OPPORTUNITIES = 'PILOT_OPPORTUNITIES',
  CUSTOMERS = 'CUSTOMERS',
  PARTNERSHIPS = 'PARTNERSHIPS',
  SUPPLIERS = 'SUPPLIERS',
  DISTRIBUTION = 'DISTRIBUTION',
  EXPORT_SUPPORT = 'EXPORT_SUPPORT',
  OTHER = 'OTHER',
}

// -------------------------------------------------------------
// 4. Taxonomy: Opportunity Categories & Status
// -------------------------------------------------------------
export enum OpportunityCategory {
  GOVERNMENT_SCHEME = 'GOVERNMENT_SCHEME',
  GRANT_FUNDING = 'GRANT_FUNDING',
  INCUBATOR_ACCELERATOR = 'INCUBATOR_ACCELERATOR',
  STARTUP_EVENT = 'STARTUP_EVENT',
  PITCH_COMPETITION = 'PITCH_COMPETITION',
  HACKATHON_CHALLENGE = 'HACKATHON_CHALLENGE',
  CORPORATE_INNOVATION = 'CORPORATE_INNOVATION',
  ENTREPRENEURSHIP_PROGRAM = 'ENTREPRENEURSHIP_PROGRAM',
  TENDER_PROCUREMENT = 'TENDER_PROCUREMENT',
  RESEARCH_DEVELOPMENT = 'RESEARCH_DEVELOPMENT',
}

export enum GovernmentLevel {
  CENTRAL = 'CENTRAL',
  STATE = 'STATE',
  LOCAL = 'LOCAL',
  PUBLIC_SECTOR = 'PUBLIC_SECTOR',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum OpportunityBenefitType {
  GRANT = 'GRANT',
  SUBSIDY = 'SUBSIDY',
  LOAN = 'LOAN',
  EQUITY_INVESTMENT = 'EQUITY_INVESTMENT',
  INCUBATION_SUPPORT = 'INCUBATION_SUPPORT',
  PROCUREMENT = 'PROCUREMENT',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  OFFICIALLY_VERIFIED = 'OFFICIALLY_VERIFIED',
  UNABLE_TO_VERIFY = 'UNABLE_TO_VERIFY',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

// -------------------------------------------------------------
// 5. Taxonomy: Startup Perks & Credits
// -------------------------------------------------------------
export enum PerkBenefitType {
  CLOUD_CREDITS = 'CLOUD_CREDITS',
  AI_API_CREDITS = 'AI_API_CREDITS',
  DEVELOPER_TOOL = 'DEVELOPER_TOOL',
  FREE_TIER = 'FREE_TIER',
  FREE_TRIAL = 'FREE_TRIAL',
  DISCOUNT = 'DISCOUNT',
  BUSINESS_SOFTWARE = 'BUSINESS_SOFTWARE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  FACILITY_ACCESS = 'FACILITY_ACCESS',
  PARTNER_SERVICE = 'PARTNER_SERVICE',
  OTHER = 'OTHER',
}

// -------------------------------------------------------------
// 6. Taxonomy: Co-Founder Matching
// -------------------------------------------------------------
export enum CommitmentPreference {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  EXPLORING = 'EXPLORING',
}

export enum WorkLocationPreference {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  IN_PERSON = 'IN_PERSON',
}

export enum ConnectionRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

// -------------------------------------------------------------
// 7. Core User & Profile Data Transfer Objects (DTOs)
// -------------------------------------------------------------
export enum UserRole {
  PUBLIC_VISITOR = 'PUBLIC_VISITOR',
  FOUNDER = 'FOUNDER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface StartupProfileDto {
  id: string;
  userId: string;
  startupName?: string;
  tagline?: string;
  description?: string;
  primaryIndustry: IndustrySector;
  secondaryIndustries: IndustrySector[];
  businessModel: BusinessModel;
  stage: StartupStage;
  countryCode: string;
  stateCode?: string;
  city?: string;
  isRegisteredCompany: boolean;
  dpiitRecognized: boolean;
  msmeRegistered: boolean;
  teamSizeBand?: string;
  needs: StartupNeed[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStartupProfileInput {
  startupName?: string;
  tagline?: string;
  description?: string;
  primaryIndustry: IndustrySector;
  secondaryIndustries?: IndustrySector[];
  businessModel: BusinessModel;
  stage: StartupStage;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  isRegisteredCompany?: boolean;
  dpiitRecognized?: boolean;
  msmeRegistered?: boolean;
  teamSizeBand?: string;
  needs?: StartupNeed[];
}

export interface UpdateStartupProfileInput extends Partial<CreateStartupProfileInput> {}

// -------------------------------------------------------------
// 8. Intelligence & Action Engine Types
// -------------------------------------------------------------
export enum EligibilityAssessment {
  LIKELY_MATCH = 'LIKELY_MATCH',
  POTENTIAL_ISSUE = 'POTENTIAL_ISSUE',
  NEEDS_INFORMATION = 'NEEDS_INFORMATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ActionRecommendation {
  id: string;
  targetType: 'OPPORTUNITY' | 'PERK';
  targetId: string;
  targetTitle: string;
  relevanceScore: number; // 0 to 100
  assessment: EligibilityAssessment;
  reasonCodes: string[];
  rationale: string;
  missingData?: string[];
  suggestedNextStep: string;
  officialSourceUrl?: string;
}

// -------------------------------------------------------------
// 9. Source Registry & Connector Types (Milestone 2)
// -------------------------------------------------------------
export enum SourceCollectionMethod {
  AUTO_DETECT = 'AUTO_DETECT',
  API = 'API',
  RSS = 'RSS',
  SITEMAP = 'SITEMAP',
  HTML = 'HTML',
}

export enum SourceHealthStatus {
  NEW = 'NEW',
  CONFIGURING = 'CONFIGURING',
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  UNSUPPORTED = 'UNSUPPORTED',
}

export enum SourcePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum SourceRunStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
}

export interface SourceSummaryDto {
  id: string;
  name: string;
  baseUrl: string;
  category: OpportunityCategory;
  collectionMethod: SourceCollectionMethod;
  priority: SourcePriority;
  checkFrequencyMinutes: number;
  isEnabled: boolean;
  healthStatus: SourceHealthStatus;
  rateLimitPerMinute: number;
  lastCheckedAt?: Date;
  lastSuccessAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveredItemPreview {
  title: string;
  url: string;
  publishedAt?: Date;
  summary?: string;
  deadline?: Date;
  organizer?: string;
  confidenceScore: number;
}

export interface SourceTestResult {
  success: boolean;
  reachable: boolean;
  detectedMethod?: SourceCollectionMethod;
  statusCode?: number;
  latencyMs: number;
  sampleItemsCount: number;
  sampleItems: DiscoveredItemPreview[];
  warnings?: string[];
  errorMessage?: string;
}

