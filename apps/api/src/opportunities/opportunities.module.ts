import { Module } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import {
  AdminOpportunitiesController,
  OpportunitiesController,
} from './opportunities.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OpportunitiesController, AdminOpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
