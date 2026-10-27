import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BusinessModel,
  IndustrySector,
  StartupNeed,
  StartupStage,
} from '@startup-radar/shared-types';

export class CreateStartupProfileDto {
  @ApiPropertyOptional({ example: 'AgroSense India' })
  @IsOptional()
  @IsString()
  startupName?: string;

  @ApiPropertyOptional({ example: 'AI & IoT powered soil testing for smallholder farmers' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'We provide real-time soil nutrient analysis to increase crop yield across rural India.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: IndustrySector, example: IndustrySector.AGRICULTURE })
  @IsEnum(IndustrySector)
  primaryIndustry!: IndustrySector;

  @ApiPropertyOptional({ enum: IndustrySector, isArray: true, example: [IndustrySector.CLEAN_ENERGY_CLIMATE, IndustrySector.SOFTWARE_IT] })
  @IsOptional()
  @IsArray()
  @IsEnum(IndustrySector, { each: true })
  secondaryIndustries?: IndustrySector[];

  @ApiProperty({ enum: BusinessModel, example: BusinessModel.B2B })
  @IsEnum(BusinessModel)
  businessModel!: BusinessModel;

  @ApiProperty({ enum: StartupStage, example: StartupStage.PROTOTYPE })
  @IsEnum(StartupStage)
  stage!: StartupStage;

  @ApiPropertyOptional({ example: 'IN', default: 'IN' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'KA' })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRegisteredCompany?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  dpiitRecognized?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  msmeRegistered?: boolean;

  @ApiPropertyOptional({ example: '1-5 members' })
  @IsOptional()
  @IsString()
  teamSizeBand?: string;

  @ApiPropertyOptional({ enum: StartupNeed, isArray: true, example: [StartupNeed.GRANTS, StartupNeed.INCUBATION, StartupNeed.CLOUD_CREDITS] })
  @IsOptional()
  @IsArray()
  @IsEnum(StartupNeed, { each: true })
  needs?: StartupNeed[];
}

export class UpdateStartupProfileDto extends CreateStartupProfileDto {}

export class UpdateNeedsDto {
  @ApiProperty({ enum: StartupNeed, isArray: true, example: [StartupNeed.GRANTS, StartupNeed.CO_FOUNDER] })
  @IsArray()
  @IsEnum(StartupNeed, { each: true })
  needs!: StartupNeed[];
}
