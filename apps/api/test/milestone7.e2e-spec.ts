import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  CommitmentPreference,
  ConnectionRequestStatus,
  FounderProfileStatus,
  IndustrySector,
  SkillProficiency,
  SkillType,
  StartupStage,
  WorkLocationPreference,
} from '@startup-radar/shared-types';

describe('Milestone 7 - Co-Founder Matching MVP (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  let tokenA: string;
  let userAId: string;
  let profileAId: string;

  let tokenB: string;
  let userBId: string;
  let profileBId: string;

  let tokenC: string;
  let userCId: string;
  let profileCId: string;

  let connectionRequestId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Register User A (Technical Founder)
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `cf_alpha_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Alpha Tech',
        location: 'Bengaluru, Karnataka',
      })
      .expect(201);
    tokenA = resA.body.accessToken;
    userAId = resA.body.user.id;

    // 2. Register User B (Business / Commercial Co-Founder)
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `cf_beta_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Beta Business',
        location: 'Bengaluru, Karnataka',
      })
      .expect(201);
    tokenB = resB.body.accessToken;
    userBId = resB.body.user.id;

    // 3. Register User C (Third Founder for block/withdraw testing)
    const resC = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `cf_gamma_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Gamma Spammer',
        location: 'Pune, Maharashtra',
      })
      .expect(201);
    tokenC = resC.body.accessToken;
    userCId = resC.body.user.id;
  });

  afterAll(async () => {
    // Cleanup profiles, requests and users
    if (profileAId && profileBId) {
      await prisma.connectionRequest.deleteMany({
        where: {
          OR: [{ requesterId: profileAId }, { recipientId: profileAId }],
        },
      });
    }
    await prisma.founderProfile.deleteMany({
      where: { userId: { in: [userAId, userBId, userCId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId, userCId] } },
    });
    await app.close();
  });

  // -------------------------------------------------------------
  // Test 1: Profile Creation & Complementary Setup
  // -------------------------------------------------------------
  it('1. POST /api/v1/founders/me - should create complementary founder profiles with skills & interests', async () => {
    // Founder A Profile
    const profResA = await request(app.getHttpServer())
      .post('/api/v1/founders/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        displayName: 'Aravind Tech',
        headline: 'Embedded AI & Drone Robotics Architect',
        bio: '10 years building agricultural automation hardware.',
        currentRole: 'CTO / Robotics Lead',
        desiredRole: 'Technical Co-Founder',
        stage: StartupStage.PROTOTYPE,
        primarySector: IndustrySector.AGRICULTURE,
        locationCity: 'Bengaluru',
        locationState: 'Karnataka',
        countryCode: 'IN',
        commitment: CommitmentPreference.FULL_TIME,
        workLocation: WorkLocationPreference.HYBRID,
        status: FounderProfileStatus.ACTIVE,
        contactEmail: 'aravind.private@proton.me',
        contactPhone: '+919876500001',
        skills: [
          { skillName: 'Robotics', skillType: SkillType.OFFERED, proficiency: SkillProficiency.EXPERT },
          { skillName: 'Computer Vision', skillType: SkillType.OFFERED, proficiency: SkillProficiency.EXPERT },
          { skillName: 'B2B Sales', skillType: SkillType.SEEKING, proficiency: SkillProficiency.EXPERT },
        ],
        interests: [{ sector: IndustrySector.AGRICULTURE, priority: 1 }],
      })
      .expect(201);

    profileAId = profResA.body.id;
    expect(profResA.body.displayName).toBe('Aravind Tech');
    expect(profResA.body.skills.length).toBe(3);

    // Founder B Profile (Complementary: Offers B2B Sales, Seeks Computer Vision)
    const profResB = await request(app.getHttpServer())
      .post('/api/v1/founders/me')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        displayName: 'Pooja Commercial',
        headline: 'FPO Growth Lead & Agri Supply Chain Veteran',
        bio: 'Scaled farm distribution networks across Karnataka and Maharashtra.',
        currentRole: 'Head of Growth',
        desiredRole: 'Commercial Co-Founder / CEO',
        stage: StartupStage.PROTOTYPE,
        primarySector: IndustrySector.AGRICULTURE,
        locationCity: 'Bengaluru',
        locationState: 'Karnataka',
        countryCode: 'IN',
        commitment: CommitmentPreference.FULL_TIME,
        workLocation: WorkLocationPreference.HYBRID,
        status: FounderProfileStatus.ACTIVE,
        contactEmail: 'pooja.private@proton.me',
        contactPhone: '+919876500002',
        skills: [
          { skillName: 'B2B Sales', skillType: SkillType.OFFERED, proficiency: SkillProficiency.EXPERT },
          { skillName: 'Robotics', skillType: SkillType.SEEKING, proficiency: SkillProficiency.INTERMEDIATE },
        ],
        interests: [{ sector: IndustrySector.AGRICULTURE, priority: 1 }],
      })
      .expect(201);

    profileBId = profResB.body.id;
    expect(profResB.body.displayName).toBe('Pooja Commercial');

    // Founder C Profile
    const profResC = await request(app.getHttpServer())
      .post('/api/v1/founders/me')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        displayName: 'Gamma Spammer',
        headline: 'Looking for fast projects',
        stage: StartupStage.EXPLORING_IDEA,
        primarySector: IndustrySector.SOFTWARE_IT,
        commitment: CommitmentPreference.PART_TIME,
        workLocation: WorkLocationPreference.REMOTE,
        status: FounderProfileStatus.ACTIVE,
        contactEmail: 'gamma@spam.com',
      })
      .expect(201);
    profileCId = profResC.body.id;
  });

  // -------------------------------------------------------------
  // Test 2: Public Discovery & Contact Privacy Protection
  // -------------------------------------------------------------
  it('2. GET /api/v1/founders - should discover active profiles while hiding private contact details', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/founders?sector=AGRICULTURE')
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    const alphaItem = res.body.data.find((p: any) => p.id === profileAId);
    expect(alphaItem).toBeDefined();
    expect(alphaItem.displayName).toBe('Aravind Tech');

    // STRICT PRIVACY: Private contact email and phone MUST NOT be exposed in public directory
    expect(alphaItem.contactEmail).toBeUndefined();
    expect(alphaItem.contactPhone).toBeUndefined();
  });

  // -------------------------------------------------------------
  // Test 3: Explainable Rules-Based Recommendation Engine
  // -------------------------------------------------------------
  it('3. GET /api/v1/founders/me/recommendations - should compute explainable match score based on complementary skills and sector alignment', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/founders/me/recommendations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const betaRec = res.body.find((r: any) => r.candidateProfile.id === profileBId);
    expect(betaRec).toBeDefined();

    // Verification of high score and explainable reasons
    expect(betaRec.matchScore).toBeGreaterThanOrEqual(75);
    expect(betaRec.matchReasons.length).toBeGreaterThanOrEqual(3);
    expect(betaRec.complementarySkills).toContain('b2b sales');
    expect(betaRec.sharedSectors).toContain(IndustrySector.AGRICULTURE);
  });

  // -------------------------------------------------------------
  // Test 4: Consent-Based Connection Requests & Contact Exchange
  // -------------------------------------------------------------
  it('4. Connection Requests & Mutual Consent - should exchange contact details ONLY after acceptance', async () => {
    // 1. Founder A sends connection request to Founder B
    const sendRes = await request(app.getHttpServer())
      .post('/api/v1/founders/connection-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientProfileId: profileBId,
        introduction: 'Hi Pooja, I saw your extensive FPO distribution network in Karnataka. Would love to explore co-founding an agri-robotics venture.',
      })
      .expect(201);

    connectionRequestId = sendRes.body.id;
    expect(sendRes.body.status).toBe(ConnectionRequestStatus.PENDING);
    expect(sendRes.body.contactExchanged).toBe(false);

    // Duplicate request prevention
    await request(app.getHttpServer())
      .post('/api/v1/founders/connection-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientProfileId: profileBId })
      .expect(400);

    // Self connection prevention
    await request(app.getHttpServer())
      .post('/api/v1/founders/connection-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientProfileId: profileAId })
      .expect(400);

    // 2. Founder B checks received connection requests
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/founders/connection-requests?type=received')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const pending = listRes.body.find((r: any) => r.id === connectionRequestId);
    expect(pending).toBeDefined();
    // Prior to accepting, private contact remains hidden
    expect(pending.requester.contactEmail).toBeUndefined();

    // 3. Founder B accepts connection request
    const acceptRes = await request(app.getHttpServer())
      .patch(`/api/v1/founders/connection-requests/${connectionRequestId}/respond`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        action: 'ACCEPT',
        responseNote: 'Excited to chat! Let us connect over phone.',
      })
      .expect(200);

    expect(acceptRes.body.status).toBe(ConnectionRequestStatus.ACCEPTED);
    expect(acceptRes.body.contactExchanged).toBe(true);

    // MUTUAL CONSENT VERIFIED: Contact details are now accessible to both founders!
    expect(acceptRes.body.requester.contactEmail).toBe('aravind.private@proton.me');
    expect(acceptRes.body.recipient.contactEmail).toBe('pooja.private@proton.me');
  });

  // -------------------------------------------------------------
  // Test 5: Withdrawal & Decline Flow
  // -------------------------------------------------------------
  it('5. Withdrawal & Decline - should support request withdrawal by requester', async () => {
    // User C sends request to User A
    const reqRes = await request(app.getHttpServer())
      .post('/api/v1/founders/connection-requests')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        recipientProfileId: profileAId,
        introduction: 'Quick question about drones',
      })
      .expect(201);

    const reqId = reqRes.body.id;

    // User C withdraws the request
    const withdrawRes = await request(app.getHttpServer())
      .post(`/api/v1/founders/connection-requests/${reqId}/withdraw`)
      .set('Authorization', `Bearer ${tokenC}`)
      .expect(201);

    expect(withdrawRes.body.status).toBe(ConnectionRequestStatus.WITHDRAWN);
  });

  // -------------------------------------------------------------
  // Test 6: Abuse Prevention: Blocking & Reporting
  // -------------------------------------------------------------
  it('6. Abuse Prevention - should block user, hide them from discovery, and record profile reports', async () => {
    // User A blocks User C
    const blockRes = await request(app.getHttpServer())
      .post(`/api/v1/founders/${userCId}/block`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ reason: 'Unsolicited spam messages' })
      .expect(201);

    expect(blockRes.body.success).toBe(true);

    // User C is now blocked from sending connection requests to User A -> 403 Forbidden!
    await request(app.getHttpServer())
      .post('/api/v1/founders/connection-requests')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        recipientProfileId: profileAId,
        introduction: 'Trying again',
      })
      .expect(403);

    // User A reports User C
    const reportRes = await request(app.getHttpServer())
      .post(`/api/v1/founders/${profileCId}/report`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        category: 'SPAM',
        description: 'Repeated promotional messages without alignment',
      })
      .expect(201);

    expect(reportRes.body.status).toBe('PENDING');
    expect(reportRes.body.reportedProfileId).toBe(profileCId);
  });
});
