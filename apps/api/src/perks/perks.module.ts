import { Module } from '@nestjs/common';
import { PerksService } from './perks.service';
import { AdminPerksController, PerksController } from './perks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerksController, AdminPerksController],
  providers: [PerksService],
  exports: [PerksService],
})
export class PerksModule {}
