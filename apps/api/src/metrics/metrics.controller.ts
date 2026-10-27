import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60) // 30 requests per minute
  async getOperationalMetrics() {
    return this.metricsService.getOperationalMetrics();
  }
}
