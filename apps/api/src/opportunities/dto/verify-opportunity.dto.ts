import { IsOptional, IsString, IsUrl } from 'class-validator';

export class VerifyOpportunityDto {
  @IsOptional()
  @IsUrl()
  officialNotificationUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectOpportunityDto {
  @IsString()
  reason: string;
}
