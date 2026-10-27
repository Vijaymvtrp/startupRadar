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
  PerkBenefitType,
  PerkProgramStatus,
  PublicationStatus,
  VerificationStatus,
} from '@startup-radar/shared-types';

export class PerkEligibilityCriterionInput {
  @IsString()
  criterionType: string;

  @IsString()
  description: string;

  @IsOptional()
  isMandatory?: boolean = true;
}

export class CreatePerkDto {
  @IsString()
  providerName: string;

  @IsString()
  officialDomain: string;

  @IsOptional()
  @IsString()
  providerType?: string = 'CLOUD_INFRASTRUCTURE';

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsString()
  programName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  officialProgramUrl: string;

  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @IsOptional()
  @IsEnum(PerkBenefitType)
  benefitType?: PerkBenefitType = PerkBenefitType.CLOUD_CREDITS;

  @IsOptional()
  @IsNumber()
  statedValueAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleCountries?: string[] = ['IN'];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleStages?: string[] = [];

  @IsOptional()
  @IsEnum(PerkProgramStatus)
  status?: PerkProgramStatus = PerkProgramStatus.ACTIVE;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus = VerificationStatus.PENDING;

  @IsOptional()
  @IsEnum(PublicationStatus)
  publicationStatus?: PublicationStatus = PublicationStatus.DRAFT;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerkEligibilityCriterionInput)
  eligibilityCriteria?: PerkEligibilityCriterionInput[];
}
