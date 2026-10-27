import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OpportunityCategory,
  GovernmentLevel,
  OpportunityBenefitType,
  VerificationStatus,
  PublicationStatus,
  DeliveryMode,
} from '@prisma/client';

export class EligibilityCriterionDto {
  @IsString()
  criterionType: string;

  @IsString()
  description: string;

  @IsOptional()
  isMandatory?: boolean = true;
}

export class CreateOpportunityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  organizer?: string;

  @IsOptional()
  @IsEnum(OpportunityCategory)
  category?: OpportunityCategory;

  @IsOptional()
  @IsEnum(GovernmentLevel)
  governmentLevel?: GovernmentLevel;

  @IsOptional()
  @IsString()
  departmentName?: string;

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
  @IsArray()
  @IsString({ each: true })
  startupStages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsEnum(OpportunityBenefitType)
  benefitType?: OpportunityBenefitType;

  @IsOptional()
  @IsNumber()
  benefitAmountMin?: number;

  @IsOptional()
  @IsNumber()
  benefitAmountMax?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @IsOptional()
  applicationDeadline?: Date | string;

  @IsOptional()
  @IsUrl()
  officialApplicationUrl?: string;

  @IsOptional()
  @IsUrl()
  officialNotificationUrl?: string;

  @IsOptional()
  @IsString()
  eligibilitySummary?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsEnum(PublicationStatus)
  publicationStatus?: PublicationStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EligibilityCriterionDto)
  eligibilityCriteria?: EligibilityCriterionDto[];
}
