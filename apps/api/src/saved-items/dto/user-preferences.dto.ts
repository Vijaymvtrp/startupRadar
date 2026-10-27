import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import {
  AlertFrequency,
  IndustrySector,
  OpportunityCategory,
} from '@startup-radar/shared-types';

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailAlertsEnabled?: boolean;

  @IsOptional()
  @IsEnum(AlertFrequency)
  alertFrequency?: AlertFrequency;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  deadlineAlertDays?: number[];

  @IsOptional()
  @IsBoolean()
  notifyStatusChanges?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNewOpportunities?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyPerkExpirations?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(OpportunityCategory, { each: true })
  interestedCategories?: OpportunityCategory[];

  @IsOptional()
  @IsArray()
  @IsEnum(IndustrySector, { each: true })
  interestedIndustries?: IndustrySector[];

  @IsOptional()
  @IsBoolean()
  isUnsubscribed?: boolean;
}
