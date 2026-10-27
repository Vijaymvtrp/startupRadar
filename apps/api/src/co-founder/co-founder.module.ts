import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CoFounderService } from './co-founder.service';
import { CoFounderController } from './co-founder.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CoFounderController],
  providers: [CoFounderService],
  exports: [CoFounderService],
})
export class CoFounderModule {}
