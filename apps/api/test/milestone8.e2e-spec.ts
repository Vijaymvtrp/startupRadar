import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  EligibilityAssessment,
  GovernmentLevel,
  IndustrySector,
  OpportunityBenefitType,
  OpportunityCategory,
  PerkBenefitType,
  PublicationStatus,
  RecommendationFeedback,
  RecommendationTargetType,
  StartupNeed,
  StartupStage,
  VerificationStatus,
} from '@startup-radar/shared-types';

describe('Milestone 8 - Startup Intelligence & Action Engine MVP (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  let founderToken: string;
  let founderUserId: string;

  let oppAgriId: string;
  let oppDpiitId: string;
  let perkProviderId: string;
  let perkCloudId: string;

  let agriRecId: string;
  let dpiitRecId: string;
  let perkRecId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Register Founder User
    const resAuth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `founder_intel_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Ramesh AgriTech',
        location: 'Hyderabad, Telangana',
      })
      .expect(201);

    founderToken = resAuth.body.accessToken;
    founderUserId = resAuth.body.user.id;

    // 2. Create Founder's Startup Profile: Agriculture, Prototype stage, Needs: Grants & Cloud Credits
    // Not DPIIT recognized yet, to test missing proof detection!
    await prisma.startupProfile.create({
      data: {
        userId: founderUserId,
        startupName: `Krishi AI ${runId}`,
        tagline: 'AI-driven soil health intelligence for Indian farmers',
        primaryIndustry: IndustrySector.AGRICULTURE,
        stage: StartupStage.PROTOTYPE,
        countryCode: 'IN',
        stateCode: 'TG',
        city: 'Hyderabad',
        isRegisteredCompany: true,
        dpiitRecognized: false,
        msmeRegistered: false,
        needs: {
          create: [
            { need: StartupNeed.GRANTS },
            { need: StartupNeed.CLOUD_CREDITS },
          ],
        },
      },
    });

    // 3. Seed Published Opportunity 1: Agriculture Grant (Direct match)
    const oppAgri = await prisma.opportunity.create({
      data: {
        slug: `agri-innovation-grant-${runId}`,
        title: `NABARD Agri Innovation Grant ${runId}`,
        summary: 'Non-dilutive grant funding for prototype agritech startups',
        description: 'Supports AI and precision agriculture startups solving farm productivity.',
        organizer: 'NABARD',
        category: OpportunityCategory.GRANT_FUNDING,
        governmentLevel: GovernmentLevel.CENTRAL,
        industries: [IndustrySector.AGRICULTURE],
        startupStages: [StartupStage.PROTOTYPE, StartupStage.MVP],
        benefitType: OpportunityBenefitType.GRANT,
        benefitAmountMin: 500000,
        benefitAmountMax: 2500000,
        currency: 'INR',
        countryCode: 'IN',
        stateCode: 'TG',
        officialApplicationUrl: `https://nabard.org/grants/apply-${runId}`,
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
    });
    oppAgriId = oppAgri.id;

    // 4. Seed Published Opportunity 2: Government Scheme with DPIIT Requirement
    const oppDpiit = await prisma.opportunity.create({
      data: {
        slug: `dpiit-seed-fund-${runId}`,
        title: `Startup India Seed Fund Scheme ${runId}`,
        summary: 'Central government seed grant. Mandatory DPIIT recognition certificate required.',
        description: 'Proof of concept and trial commercialization funding for recognized entities.',
        organizer: 'DPIIT Ministry of Commerce & Industry',
        category: OpportunityCategory.GOVERNMENT_SCHEME,
        governmentLevel: GovernmentLevel.CENTRAL,
        industries: [IndustrySector.AGRICULTURE, IndustrySector.SOFTWARE_IT],
        startupStages: [StartupStage.PROTOTYPE],
        benefitType: OpportunityBenefitType.GRANT,
        benefitAmountMin: 1000000,
        benefitAmountMax: 5000000,
        currency: 'INR',
        countryCode: 'IN',
        officialApplicationUrl: `https://seedfund.startupindia.gov.in/apply-${runId}`,
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
    });
    oppDpiitId = oppDpiit.id;

    // 5. Seed Perk Provider and Active Perk Program
    const provider = await prisma.perkProvider.create({
      data: {
        name: `Cloudscale India ${runId}`,
        officialDomain: `cloudscale-${runId}.example.com`,
      },
    });
    perkProviderId = provider.id;

    const perkCloud = await prisma.startupPerkProgram.create({
      data: {
        slug: `cloudscale-founders-tier-${runId}`,
        programName: `Cloudscale Founders Program $10,000 Credits ${runId}`,
        description: 'Deploy GPUs, Kubernetes clusters, and compute nodes at zero cost for 12 months.',
        providerId: provider.id,
        benefitType: PerkBenefitType.CLOUD_CREDITS,
        statedValueAmount: 10000,
        currency: 'USD',
        officialProgramUrl: `https://cloudscale.example.com/founders-${runId}`,
        eligibleStages: [StartupStage.PROTOTYPE, StartupStage.MVP],
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
    });
    perkCloudId = perkCloud.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.recommendationFeedbackRecord.deleteMany({
        where: { userId: founderUserId },
      });
      await prisma.recommendation.deleteMany({
        where: { userId: founderUserId },
      });
      await prisma.recommendationRun.deleteMany({
        where: { userId: founderUserId },
      });
      await prisma.opportunity.deleteMany({
        where: { id: { in: [oppAgriId, oppDpiitId] } },
      });
      if (perkCloudId) {
        await prisma.startupPerkProgram.deleteMany({
          where: { id: perkCloudId },
        });
      }
      if (perkProviderId) {
        await prisma.perkProvider.deleteMany({
          where: { id: perkProviderId },
        });
      }
      await prisma.startupProfileNeed.deleteMany({
        where: { startupProfile: { userId: founderUserId } },
      });
      await prisma.startupProfile.deleteMany({
        where: { userId: founderUserId },
      });
      await prisma.user.deleteMany({
        where: { id: founderUserId },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /api/v1/recommendations/generate - should deterministically generate recommendations', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/recommendations/generate')
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('2. GET /api/v1/recommendations - should list recommendations with deterministic scores & rationale', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations')
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    // Find our specific generated recommendations
    const agriRec = res.body.find(
      (r: any) =>
        r.targetType === RecommendationTargetType.OPPORTUNITY &&
        r.targetId === oppAgriId,
    );
    expect(agriRec).toBeDefined();
    expect(agriRec.relevanceScore).toBeGreaterThanOrEqual(75); // 20 base + 30 sector + 25 stage + 20 need
    expect(agriRec.assessment).toBe(EligibilityAssessment.LIKELY_MATCH);
    expect(agriRec.reasonCodes).toContain('PRIMARY_SECTOR_MATCH');
    expect(agriRec.reasonCodes).toContain('STAGE_MATCH');
    agriRecId = agriRec.id;

    const perkRec = res.body.find(
      (r: any) =>
        r.targetType === RecommendationTargetType.PERK &&
        r.targetId === perkCloudId,
    );
    expect(perkRec).toBeDefined();
    expect(perkRec.relevanceScore).toBeGreaterThanOrEqual(80); // 25 base + 35 cloud need + 25 stage
    expect(perkRec.assessment).toBe(EligibilityAssessment.LIKELY_MATCH);
    expect(perkRec.reasonCodes).toContain('NEED_MATCH_CLOUD_CREDITS');
    perkRecId = perkRec.id;
  });

  it('3. GET /api/v1/recommendations - should detect missing proofs (DPIIT Recognition) as NEEDS_INFORMATION', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations')
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(200);

    const dpiitRec = res.body.find(
      (r: any) =>
        r.targetType === RecommendationTargetType.OPPORTUNITY &&
        r.targetId === oppDpiitId,
    );
    expect(dpiitRec).toBeDefined();
    expect(dpiitRec.assessment).toBe(EligibilityAssessment.NEEDS_INFORMATION);
    expect(dpiitRec.missingData).toContain('DPIIT Startup Recognition');
    expect(dpiitRec.suggestedNextStep).toContain('DPIIT Recognition');
    dpiitRecId = dpiitRec.id;
  });

  it('4. GET /api/v1/recommendations/summary - should return aggregated intelligence overview & next steps', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations/summary')
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('totalCount');
    expect(res.body).toHaveProperty('likelyMatchesCount');
    expect(res.body).toHaveProperty('needsInfoCount');
    expect(res.body.needsInfoCount).toBeGreaterThanOrEqual(1);
    expect(res.body.missingProfileFields).toContain(
      'DPIIT Startup Recognition',
    );
    expect(Array.isArray(res.body.topNextSteps)).toBe(true);
    expect(res.body.topNextSteps.length).toBeGreaterThan(0);
  });

  it('5. POST /api/v1/recommendations/:id/feedback - should submit founder feedback on recommendation quality', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/recommendations/${agriRecId}/feedback`)
      .set('Authorization', `Bearer ${founderToken}`)
      .send({
        feedback: RecommendationFeedback.RELEVANT,
        comments: 'Extremely relevant grant for our agritech prototype phase!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.feedback).toBe(RecommendationFeedback.RELEVANT);

    // Verify feedback is saved in database
    const dbFeedback = await prisma.recommendationFeedbackRecord.findFirst({
      where: {
        userId: founderUserId,
        recommendationId: agriRecId,
      },
    });
    expect(dbFeedback).toBeDefined();
    expect(dbFeedback?.feedback).toBe('RELEVANT');
    expect(dbFeedback?.comments).toBe(
      'Extremely relevant grant for our agritech prototype phase!',
    );
  });

  it('6. POST /api/v1/recommendations/:id/dismiss - should dismiss recommendation and exclude from active list', async () => {
    // Dismiss perk recommendation
    const resDismiss = await request(app.getHttpServer())
      .post(`/api/v1/recommendations/${perkRecId}/dismiss`)
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(200);

    expect(resDismiss.body.isDismissed).toBe(true);

    // Verify GET /api/v1/recommendations no longer returns the dismissed perk
    const resList = await request(app.getHttpServer())
      .get('/api/v1/recommendations')
      .set('Authorization', `Bearer ${founderToken}`)
      .expect(200);

    const dismissedFound = resList.body.find(
      (r: any) => r.id === perkRecId,
    );
    expect(dismissedFound).toBeUndefined();
  });
});
