import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SaveOpportunityDto {
  @IsNotEmpty()
  @IsUUID()
  opportunityId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
