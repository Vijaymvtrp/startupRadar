import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReviewQueueService } from './review-queue.service';
import { ReviewStatus } from '@prisma/client';

class ReviewDecisionDto {
  notes?: string;
}

@ApiTags('Admin - Review Queue')
@Controller('admin/review-queue')
export class ReviewQueueController {
  constructor(private readonly reviewQueueService: ReviewQueueService) {}

  @Get()
  @ApiOperation({ summary: 'List pending opportunities requiring human verification' })
  @ApiQuery({ name: 'status', enum: ReviewStatus, required: false })
  listQueue(@Query('status') status?: ReviewStatus) {
    return this.reviewQueueService.listQueue(status);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve opportunity and publish officially' })
  approve(@Param('id') id: string, @Body() body: ReviewDecisionDto) {
    return this.reviewQueueService.approve(id, body?.notes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject unverified or inaccurate opportunity listing' })
  reject(@Param('id') id: string, @Body() body: ReviewDecisionDto) {
    return this.reviewQueueService.reject(id, body?.notes);
  }
}
