import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { SearchOpportunitiesDto } from './dto/search-opportunities.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { RejectOpportunityDto, VerifyOpportunityDto } from './dto/verify-opportunity.dto';

@ApiTags('Public - Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Search and filter public startup opportunities (government schemes, grants, incubators, tenders)',
  })
  search(@Query() query: SearchOpportunitiesDto) {
    return this.opportunitiesService.search(query, false);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get canonical opportunity details by slug with source provenance and eligibility',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.opportunitiesService.findBySlug(slug, false);
  }
}

@ApiTags('Admin - Opportunities')
@Controller('admin/opportunities')
export class AdminOpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin search across all opportunities including drafts and unverified' })
  searchAdmin(@Query() query: SearchOpportunitiesDto) {
    return this.opportunitiesService.search(query, true);
  }

  @Post()
  @ApiOperation({ summary: 'Create manual/official verified opportunity' })
  create(@Body() body: CreateOpportunityDto, @Request() req: any) {
    const adminId = req?.user?.id || 'admin-system';
    return this.opportunitiesService.create(body, adminId);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Officially verify opportunity against gazette/official notice' })
  verify(
    @Param('id') id: string,
    @Body() body: VerifyOpportunityDto,
    @Request() req: any,
  ) {
    const adminId = req?.user?.id || 'admin-system';
    return this.opportunitiesService.verify(id, adminId, body);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject or withdraw inaccurate/invalid opportunity' })
  reject(
    @Param('id') id: string,
    @Body() body: RejectOpportunityDto,
    @Request() req: any,
  ) {
    const adminId = req?.user?.id || 'admin-system';
    return this.opportunitiesService.reject(id, adminId, body.reason);
  }
}
