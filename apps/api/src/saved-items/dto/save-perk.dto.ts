import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SavePerkDto {
  @IsNotEmpty()
  @IsUUID()
  perkProgramId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
