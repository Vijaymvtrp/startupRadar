import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import {
  OpportunityCategory,
  SourceCollectionMethod,
  SourcePriority,
} from '@startup-radar/shared-types';

export class SourceConfigInputDto {
  @ApiPropertyOptional({ example: 'https://startupindia.gov.in/api/schemes' })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiPropertyOptional({ example: 'https://birac.nic.in/rss.xml' })
  @IsOptional()
  @IsString()
  feedUrl?: string;

  @ApiPropertyOptional({ example: 'https://dst.gov.in/sitemap.xml' })
  @IsOptional()
  @IsString()
  sitemapUrl?: string;

  @ApiPropertyOptional({ example: '.scheme-listing-card' })
  @IsOptional()
  @IsString()
  htmlListingSelector?: string;

  @ApiPropertyOptional({ example: 'h3.title' })
  @IsOptional()
  @IsString()
  htmlTitleSelector?: string;

  @ApiPropertyOptional({ example: 'a.apply-link' })
  @IsOptional()
  @IsString()
  htmlLinkSelector?: string;
}

export class CreateSourceDto {
  @ApiProperty({ example: 'Startup India Central Portal' })
  @IsString()
  @IsNotEmpty({ message: 'Source name is required' })
  name!: string;

  @ApiProperty({ example: 'https://www.startupindia.gov.in' })
  @IsUrl({}, { message: 'Must be a valid HTTP/HTTPS URL' })
  baseUrl!: string;

  @ApiPropertyOptional({ example: ['startupindia.gov.in'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiProperty({ enum: OpportunityCategory, example: OpportunityCategory.GOVERNMENT_SCHEME })
  @IsEnum(OpportunityCategory)
  category!: OpportunityCategory;

  @ApiProperty({ enum: SourceCollectionMethod, example: SourceCollectionMethod.AUTO_DETECT })
  @IsEnum(SourceCollectionMethod)
  collectionMethod!: SourceCollectionMethod;

  @ApiPropertyOptional({ enum: SourcePriority, example: SourcePriority.HIGH, default: SourcePriority.MEDIUM })
  @IsOptional()
  @IsEnum(SourcePriority)
  priority?: SourcePriority;

  @ApiPropertyOptional({ example: 1440, default: 1440 })
  @IsOptional()
  @IsInt()
  @Min(15)
  checkFrequencyMinutes?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ example: 'IN', default: 'IN' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'DL' })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ example: 'New Delhi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Official Department for Promotion of Industry and Internal Trade (DPIIT)' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: SourceConfigInputDto })
  @IsOptional()
  config?: SourceConfigInputDto;
}

export class TestSourceDto {
  @ApiProperty({ example: 'https://birac.nic.in/rss.xml' })
  @IsUrl({}, { message: 'Must be a valid HTTP/HTTPS URL' })
  baseUrl!: string;

  @ApiPropertyOptional({ enum: SourceCollectionMethod, default: SourceCollectionMethod.AUTO_DETECT })
  @IsOptional()
  @IsEnum(SourceCollectionMethod)
  collectionMethod?: SourceCollectionMethod;

  @ApiPropertyOptional({ type: SourceConfigInputDto })
  @IsOptional()
  config?: SourceConfigInputDto;
}
