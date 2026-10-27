import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and Database Health' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  async check() {
    let dbStatus = 'healthy';
    let latencyMs = 0;

    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = `unreachable: ${err.message}`;
    }

    return {
      status: 'ok',
      service: 'Startup Radar India API',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs,
      },
    };
  }
}
