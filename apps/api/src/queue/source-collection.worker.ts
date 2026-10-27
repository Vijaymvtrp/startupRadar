import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectorRegistryService } from '../connectors/connector-registry.service';
import { SourceHealthStatus, SourceRunStatus } from '@startup-radar/shared-types';

@Injectable()
export class SourceCollectionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SourceCollectionWorker.name);
  private worker!: Worker;
  private redisConnection!: IORedis;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly connectorRegistry: ConnectorRegistryService,
  ) {}

  onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      'redis://localhost:6379';

    const isTls = redisUrl.startsWith('rediss://');
    this.redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      tls: isTls ? {} : undefined,
    });

    this.worker = new Worker(
      'source-collection-queue',
      async (job: Job) => {
        await this.processJob(job);
      },
      {
        connection: this.redisConnection as any,
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job: Job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  private async processJob(job: Job) {
    const { sourceId, runId } = job.data;
    const start = Date.now();

    this.logger.log(`Processing source collection for sourceId: ${sourceId}, runId: ${runId}`);

    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      include: { config: true },
    });

    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    try {
      const items = await this.connectorRegistry.discover(
        source.baseUrl,
        source.collectionMethod as any,
        source.config,
      );

      const durationMs = Date.now() - start;

      // Update SourceRun
      await this.prisma.sourceRun.update({
        where: { id: runId },
        data: {
          status: SourceRunStatus.SUCCESS as any,
          itemsDiscovered: items.length,
          itemsExtracted: items.length,
          finishedAt: new Date(),
          durationMs,
        },
      });

      // Update Source Status
      await this.prisma.source.update({
        where: { id: sourceId },
        data: {
          healthStatus: SourceHealthStatus.HEALTHY as any,
          lastCheckedAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });

      this.logger.log(
        `Source ${source.name} collected ${items.length} items in ${durationMs}ms`,
      );
    } catch (err: any) {
      const durationMs = Date.now() - start;

      // Record failure in SourceRun
      await this.prisma.sourceRun.update({
        where: { id: runId },
        data: {
          status: SourceRunStatus.FAILED as any,
          errorMessage: err.message,
          finishedAt: new Date(),
          durationMs,
        },
      });

      // Update Source with Error
      await this.prisma.source.update({
        where: { id: sourceId },
        data: {
          healthStatus: SourceHealthStatus.FAILED as any,
          lastCheckedAt: new Date(),
          lastError: err.message,
        },
      });

      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
  }
}
