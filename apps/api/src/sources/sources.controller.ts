import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto, TestSourceDto } from './sources.dto';
import { SourceHealthStatus } from '@startup-radar/shared-types';

@ApiTags('Admin - Sources Management')
@Controller('admin/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered opportunity sources and health statuses' })
  @ApiQuery({ name: 'status', enum: SourceHealthStatus, required: false })
  listSources(@Query('status') status?: SourceHealthStatus) {
    return this.sourcesService.listSources(status);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new opportunity source with SSRF verification and live connectivity check' })
  @ApiResponse({ status: 201, description: 'Source registered successfully' })
  createSource(@Body() dto: CreateSourceDto) {
    return this.sourcesService.createSource(dto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test extraction preview from a URL without saving the source' })
  testSource(@Body() dto: TestSourceDto) {
    return this.sourcesService.testSource(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and run history of a specific source' })
  getSource(@Param('id') id: string) {
    return this.sourcesService.getSource(id);
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Trigger an immediate background collection run via BullMQ' })
  triggerRun(@Param('id') id: string) {
    return this.sourcesService.triggerRun(id);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'List recent collection runs for a source' })
  listSourceRuns(@Param('id') id: string) {
    return this.sourcesService.listRuns(id);
  }
}

@ApiTags('Admin - Source Runs')
@Controller('admin/source-runs')
export class SourceRunsController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List global background source runs history' })
  listAllRuns() {
    return this.sourcesService.listRuns();
  }
}
