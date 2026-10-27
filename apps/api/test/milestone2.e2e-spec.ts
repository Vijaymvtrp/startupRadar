import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OpportunityCategory, SourceCollectionMethod, SourcePriority } from '@startup-radar/shared-types';

describe('Milestone 2 - Source Registry & Ingestion Pipeline (E2E)', () => {
  let app: INestApplication;
  let createdSourceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. SSRF Protection - should strictly block private IP/localhost sources', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/sources/test')
      .send({
        baseUrl: 'http://127.0.0.1:8080/internal',
        collectionMethod: SourceCollectionMethod.AUTO_DETECT,
      })
      .expect(400);

    expect(res.body.message).toContain('prohibited');
  });

  it('2. SSRF Protection - should block cloud metadata link-local address (169.254.169.254)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/sources/test')
      .send({
        baseUrl: 'http://169.254.169.254/latest/meta-data',
        collectionMethod: SourceCollectionMethod.AUTO_DETECT,
      })
      .expect(400);

    expect(res.body.message).toContain('prohibited');
  });

  it('3. POST /api/v1/admin/sources - should register an official source in Supabase', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/sources')
      .send({
        name: 'Startup India Hub',
        baseUrl: 'https://www.startupindia.gov.in',
        allowedDomains: ['startupindia.gov.in'],
        category: OpportunityCategory.GOVERNMENT_SCHEME,
        collectionMethod: SourceCollectionMethod.HTML,
        priority: SourcePriority.HIGH,
        checkFrequencyMinutes: 1440,
        rateLimitPerMinute: 5,
        countryCode: 'IN',
        stateCode: 'DL',
        city: 'New Delhi',
        notes: 'Department for Promotion of Industry and Internal Trade',
      })
      .expect(201);

    expect(res.body.source.id).toBeDefined();
    expect(res.body.source.name).toBe('Startup India Hub');
    expect(res.body.source.baseUrl).toBe('https://www.startupindia.gov.in/');
    createdSourceId = res.body.source.id;
  });

  it('4. GET /api/v1/admin/sources - should list registered sources', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/sources')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((s: any) => s.id === createdSourceId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Startup India Hub');
  });

  it('5. POST /api/v1/admin/sources/:id/run - should queue collection run in BullMQ & Upstash Redis', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/sources/${createdSourceId}/run`)
      .expect(201);

    expect(res.body.message).toContain('queued');
    expect(res.body.runId).toBeDefined();
    expect(res.body.sourceId).toBe(createdSourceId);
  });

  it('6. GET /api/v1/admin/source-runs - should list background runs history', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/source-runs')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
