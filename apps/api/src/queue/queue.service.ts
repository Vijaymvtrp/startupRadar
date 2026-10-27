import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisConnection!: IORedis;
  public collectionQueue!: Queue;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      'redis://localhost:6379';

    this.logger.log(`Initializing BullMQ with Redis at: ${redisUrl.split('@')[1] || 'localhost'}`);

    // BullMQ requires maxRetriesPerRequest: null
    const isTls = redisUrl.startsWith('rediss://');
    this.redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      tls: isTls ? {} : undefined,
    });

    this.collectionQueue = new Queue('source-collection-queue', {
      connection: this.redisConnection as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  async enqueueSourceCollection(sourceId: string, runId: string, priority = 1) {
    return this.collectionQueue.add(
      'SOURCE_COLLECTION',
      { sourceId, runId },
      {
        priority,
        jobId: `collect_${sourceId}_${Date.now()}`,
      },
    );
  }

  async onModuleDestroy() {
    if (this.collectionQueue) {
      await this.collectionQueue.close();
    }
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
  }
}
