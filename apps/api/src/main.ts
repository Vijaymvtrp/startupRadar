import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Startup Radar India API')
    .setDescription(
      'Complete API specification for Startup Radar India — Opportunities, Perks, Co-Founder Matching, and Action Intelligence',
    )
    .setVersion('3.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 Startup Radar API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation ready at: http://localhost:${port}/api/docs`);
}

bootstrap();
