import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'founder@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @ApiPropertyOptional({ example: 'Bengaluru, Karnataka' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'founder@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  password!: string;
}
