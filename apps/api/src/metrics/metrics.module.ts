import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService, RateLimitGuard],
  exports: [MetricsService],
})
export class MetricsModule {}
