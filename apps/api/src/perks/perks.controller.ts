import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PerksService } from './perks.service';
import { SearchPerksDto } from './dto/search-perks.dto';
import { CreatePerkDto } from './dto/create-perk.dto';
import { RejectPerkDto, VerifyPerkDto } from './dto/verify-perk.dto';

@ApiTags('Public - Perks & Credits')
@Controller('perks')
export class PerksController {
  constructor(private readonly perksService: PerksService) {}

  @Get()
  @ApiOperation({
    summary: 'Search and filter active startup perks, cloud credits, and developer tools',
  })
  search(@Query() query: SearchPerksDto) {
    return this.perksService.search(query, false);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get canonical perk details by slug with eligibility checklist and official terms',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.perksService.findBySlug(slug, false);
  }
}

@ApiTags('Admin - Perks & Credits')
@Controller('admin/perks')
export class AdminPerksController {
  constructor(private readonly perksService: PerksService) {}

  @Get()
  @ApiOperation({ summary: 'Admin search across all perk programs including drafts' })
  searchAdmin(@Query() query: SearchPerksDto) {
    return this.perksService.search(query, true);
  }

  @Post()
  @ApiOperation({ summary: 'Register/create a verified perk offer' })
  create(@Body() body: CreatePerkDto, @Request() req: any) {
    const adminId = req?.user?.id || 'admin-system';
    return this.perksService.create(body, adminId);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Officially verify a perk program against partner terms' })
  verify(
    @Param('id') id: string,
    @Body() body: VerifyPerkDto,
    @Request() req: any,
  ) {
    const adminId = req?.user?.id || 'admin-system';
    return this.perksService.verify(id, adminId, body);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject or mark expired/inaccurate perk program' })
  reject(
    @Param('id') id: string,
    @Body() body: RejectPerkDto,
    @Request() req: any,
  ) {
    const adminId = req?.user?.id || 'admin-system';
    return this.perksService.reject(id, adminId, body.reason);
  }
}
