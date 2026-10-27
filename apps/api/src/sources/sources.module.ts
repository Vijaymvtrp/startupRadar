import { Module } from '@nestjs/common';
import { SourcesController, SourceRunsController } from './sources.controller';
import { SourcesService } from './sources.service';
import { ConnectorsModule } from '../connectors/connectors.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [ConnectorsModule, QueueModule],
  controllers: [SourcesController, SourceRunsController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
