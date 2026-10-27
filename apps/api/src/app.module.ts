import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { AuthModule } from './auth/auth.module';
import { StartupProfileModule } from './startup-profile/startup-profile.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { QueueModule } from './queue/queue.module';
import { SourcesModule } from './sources/sources.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
    }),
    PrismaModule,
    HealthModule,
    TaxonomyModule,
    AuthModule,
    StartupProfileModule,
    ConnectorsModule,
    QueueModule,
    SourcesModule,
  ],
})
export class AppModule {}
