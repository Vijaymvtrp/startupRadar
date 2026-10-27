import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  OpportunityCategory,
  GovernmentLevel,
  OpportunityBenefitType,
  VerificationStatus,
  DeliveryMode,
} from '@prisma/client';

export enum DeadlineFilter {
  ACTIVE = 'ACTIVE',
  CLOSING_SOON = 'CLOSING_SOON',
  EXPIRED = 'EXPIRED',
}

export class SearchOpportunitiesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OpportunityCategory)
  category?: OpportunityCategory;

  @IsOptional()
  @IsEnum(GovernmentLevel)
  governmentLevel?: GovernmentLevel;

  @IsOptional()
  @IsEnum(OpportunityBenefitType)
  benefitType?: OpportunityBenefitType;

  @IsOptional()
  @IsString()
  countryCode?: string = 'IN';

  @IsOptional()
  @IsString()
  stateCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(DeadlineFilter)
  deadlineStatus?: DeadlineFilter;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'closing_soon' | 'recently_verified' = 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
