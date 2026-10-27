import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  PerkBenefitType,
  PerkProgramStatus,
  VerificationStatus,
} from '@prisma/client';

export class SearchPerksDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PerkBenefitType)
  benefitType?: PerkBenefitType;

  @IsOptional()
  @IsEnum(PerkProgramStatus)
  status?: PerkProgramStatus;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  countryCode?: string = 'IN';

  @IsOptional()
  @IsString()
  sort?: 'highest_value' | 'newest' | 'recently_verified' = 'newest';

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
