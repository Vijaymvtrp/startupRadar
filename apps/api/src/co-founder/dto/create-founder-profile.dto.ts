import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CommitmentPreference,
  FounderProfileStatus,
  IndustrySector,
  SkillProficiency,
  SkillType,
  StartupStage,
  WorkLocationPreference,
} from '@startup-radar/shared-types';

export class FounderSkillInput {
  @IsNotEmpty()
  @IsString()
  skillName: string;

  @IsEnum(SkillType)
  skillType: SkillType;

  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;
}

export class FounderInterestInput {
  @IsEnum(IndustrySector)
  sector: IndustrySector;

  @IsOptional()
  priority?: number;
}

export class CreateFounderProfileDto {
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  currentRole?: string;

  @IsOptional()
  @IsString()
  desiredRole?: string;

  @IsOptional()
  @IsEnum(StartupStage)
  stage?: StartupStage;

  @IsOptional()
  @IsEnum(IndustrySector)
  primarySector?: IndustrySector;

  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsString()
  locationState?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(CommitmentPreference)
  commitment?: CommitmentPreference;

  @IsOptional()
  @IsEnum(WorkLocationPreference)
  workLocation?: WorkLocationPreference;

  @IsOptional()
  @IsEnum(FounderProfileStatus)
  status?: FounderProfileStatus;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FounderSkillInput)
  skills?: FounderSkillInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FounderInterestInput)
  interests?: FounderInterestInput[];
}
