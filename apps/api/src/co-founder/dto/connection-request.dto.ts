import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendConnectionRequestDto {
  @IsNotEmpty()
  @IsUUID()
  recipientProfileId: string;

  @IsOptional()
  @IsString()
  introduction?: string;
}

export class RespondConnectionRequestDto {
  @IsNotEmpty()
  @IsIn(['ACCEPT', 'DECLINE'])
  action: 'ACCEPT' | 'DECLINE';

  @IsOptional()
  @IsString()
  responseNote?: string;
}
