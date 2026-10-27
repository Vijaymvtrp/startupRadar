import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Milestone 9 - Production Readiness, Security & Pilot Metrics (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('1. GET /api/v1/health - should return healthy API and live database connectivity status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'Startup Radar India API');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.status).toBe('healthy');
    expect(typeof res.body.database.latencyMs).toBe('number');
  });

  it('2. Security Headers Middleware - should inject OWASP recommended security headers on all responses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('3. GET /api/v1/metrics - should return comprehensive platform & data freshness metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/metrics')
      .expect(200);

    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('sourceFreshness');
    expect(res.body.sourceFreshness).toHaveProperty('totalSources');
    expect(res.body.sourceFreshness).toHaveProperty('freshnessRate');

    expect(res.body).toHaveProperty('opportunities');
    expect(res.body.opportunities).toHaveProperty('totalOpportunities');
    expect(res.body.opportunities).toHaveProperty('verificationRate');
    expect(res.body.opportunities).toHaveProperty('pendingReviewItems');

    expect(res.body).toHaveProperty('perks');
    expect(res.body.perks).toHaveProperty('totalPerkPrograms');
    expect(res.body.perks).toHaveProperty('activePerkPrograms');

    expect(res.body).toHaveProperty('founderMatching');
    expect(res.body.founderMatching).toHaveProperty('totalFounders');
    expect(res.body.founderMatching).toHaveProperty('totalConnectionRequests');

    expect(res.body).toHaveProperty('intelligence');
    expect(res.body.intelligence).toHaveProperty('totalRecommendations');
    expect(res.body.intelligence).toHaveProperty('relevanceQualityScore');

    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('uptimeSeconds');
    expect(res.body.system).toHaveProperty('nodeVersion');
    expect(res.body.system).toHaveProperty('memoryUsageMb');
    expect(res.body.system.database.status).toBe('healthy');
  });

  it('4. RateLimitGuard - should return standard X-RateLimit headers on protected endpoints', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/metrics')
      .expect(200);

    expect(res.headers).toHaveProperty('x-ratelimit-limit');
    expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    expect(res.headers).toHaveProperty('x-ratelimit-reset');
    expect(Number(res.headers['x-ratelimit-limit'])).toBe(30);
  });

  it(
    '5. RateLimitGuard - should enforce HTTP 429 when rate limit is exceeded',
    async () => {
      // Send 35 rapid requests to exceed the 30-request threshold
      let rateLimitedResponse: any = null;

      for (let i = 0; i < 35; i++) {
        const res = await request(app.getHttpServer()).get('/api/v1/metrics');
        if (res.status === 429) {
          rateLimitedResponse = res;
          break;
        }
      }

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body).toHaveProperty('statusCode', 429);
      expect(rateLimitedResponse.body.message).toContain('Too many requests');
      expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
    },
    30000,
  );
});
