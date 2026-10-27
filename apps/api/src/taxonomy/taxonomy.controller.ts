import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomy.service';

@ApiTags('Taxonomy')
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve full industry-agnostic taxonomy, stages, needs, and categories' })
  @ApiResponse({ status: 200, description: 'Taxonomy details retrieved successfully' })
  getTaxonomy() {
    return this.taxonomyService.getTaxonomy();
  }
}
