import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { IndustrySector, BusinessModel, StartupStage, StartupNeed } from '@startup-radar/shared-types';

describe('Milestone 1 - Foundation, Taxonomy & Startup Profile (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  const testEmail = `founder_${Date.now()}@test.com`;

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

  it('1. GET /api/v1/health - should report healthy API and Supabase database connection', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database.status).toBe('healthy');
  });

  it('2. GET /api/v1/taxonomy - should return full industry-agnostic taxonomy, stages and needs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/taxonomy')
      .expect(200);

    expect(res.body.industries).toContain(IndustrySector.AGRICULTURE);
    expect(res.body.industries).toContain(IndustrySector.MANUFACTURING);
    expect(res.body.industries).toContain(IndustrySector.SOFTWARE_IT);
    expect(res.body.stages).toContain(StartupStage.EXPLORING_IDEA);
    expect(res.body.needs).toContain(StartupNeed.GRANTS);
  });

  it('3. POST /api/v1/auth/register - should register a new founder and return JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        fullName: 'Ramesh Patel',
        location: 'Ahmedabad, Gujarat',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    authToken = res.body.accessToken;
  });

  it('4. PUT /api/v1/startup-profile/me - should create industry-agnostic profile without claiming false registration', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/startup-profile/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        startupName: 'KrishiKiran',
        tagline: 'Solar-powered agricultural cold storage',
        primaryIndustry: IndustrySector.AGRICULTURE,
        secondaryIndustries: [IndustrySector.CLEAN_ENERGY_CLIMATE, IndustrySector.MANUFACTURING],
        businessModel: BusinessModel.B2B,
        stage: StartupStage.PROTOTYPE,
        countryCode: 'IN',
        stateCode: 'GJ',
        city: 'Ahmedabad',
        isRegisteredCompany: false, // Idea/prototype stage, not yet incorporated
        dpiitRecognized: false,
        msmeRegistered: false,
        needs: [StartupNeed.GRANTS, StartupNeed.INCUBATION, StartupNeed.FACILITIES_EQUIPMENT],
      })
      .expect(200);

    expect(res.body.profile.startupName).toBe('KrishiKiran');
    expect(res.body.profile.primaryIndustry).toBe(IndustrySector.AGRICULTURE);
    expect(res.body.profile.secondaryIndustries).toHaveLength(2);
    expect(res.body.profile.isRegisteredCompany).toBe(false);
    expect(res.body.profile.needs).toContain(StartupNeed.GRANTS);
  });

  it('5. GET /api/v1/startup-profile/me - should retrieve the saved profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/startup-profile/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.hasProfile).toBe(true);
    expect(res.body.profile.startupName).toBe('KrishiKiran');
    expect(res.body.profile.needs).toHaveLength(3);
  });
});
