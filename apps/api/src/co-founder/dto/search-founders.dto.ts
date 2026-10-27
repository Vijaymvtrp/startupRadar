import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CommitmentPreference,
  IndustrySector,
  StartupStage,
  WorkLocationPreference,
} from '@startup-radar/shared-types';

export class SearchFoundersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(IndustrySector)
  sector?: IndustrySector;

  @IsOptional()
  @IsEnum(StartupStage)
  stage?: StartupStage;

  @IsOptional()
  @IsEnum(CommitmentPreference)
  commitment?: CommitmentPreference;

  @IsOptional()
  @IsEnum(WorkLocationPreference)
  workLocation?: WorkLocationPreference;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  seekingSkill?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
