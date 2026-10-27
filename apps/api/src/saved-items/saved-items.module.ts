import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SavedItemsService } from './saved-items.service';
import { DeadlineAlertsService } from './deadline-alerts.service';
import { SavedItemsController } from './saved-items.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SavedItemsController],
  providers: [SavedItemsService, DeadlineAlertsService],
  exports: [SavedItemsService, DeadlineAlertsService],
})
export class SavedItemsModule {}
