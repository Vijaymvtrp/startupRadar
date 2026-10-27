import { IsOptional, IsString, IsUrl } from 'class-validator';

export class VerifyPerkDto {
  @IsOptional()
  @IsUrl()
  officialProgramUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPerkDto {
  @IsString()
  reason: string;
}
