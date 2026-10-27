import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { SourceCollectionWorker } from './source-collection.worker';
import { ConnectorsModule } from '../connectors/connectors.module';

@Module({
  imports: [ConnectorsModule],
  providers: [QueueService, SourceCollectionWorker],
  exports: [QueueService],
})
export class QueueModule {}
