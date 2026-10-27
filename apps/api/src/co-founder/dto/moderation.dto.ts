import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BlockUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReportProfileDto {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
