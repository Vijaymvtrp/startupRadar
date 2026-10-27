import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OpportunitiesService } from '../src/opportunities/opportunities.service';
import {
  OpportunityCategory,
  GovernmentLevel,
  OpportunityBenefitType,
  VerificationStatus,
  PublicationStatus,
  DeliveryMode,
} from '@startup-radar/shared-types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Milestone 4 - Startup Opportunities MVP (E2E)', () => {
  let app: INestApplication;
  let opportunitiesService: OpportunitiesService;
  let prisma: PrismaService;

  const runId = Date.now();
  let verifiedOppSlug: string;
  let draftOppId: string;
  let draftOppSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    opportunitiesService = app.get(OpportunitiesService);
    prisma = app.get(PrismaService);

    // 1. Seed a verified published opportunity
    const pubOpp = await opportunitiesService.create({
      title: `Startup India Seed Fund Scheme ${runId}`,
      summary: 'Financial assistance to startups for proof of concept, prototype, product trials',
      description: 'Department for Promotion of Industry and Internal Trade (DPIIT) initiative providing up to 50 Lakhs grant.',
      organizer: 'DPIIT Ministry of Commerce & Industry',
      category: OpportunityCategory.GOVERNMENT_SCHEME,
      governmentLevel: GovernmentLevel.CENTRAL,
      departmentName: 'DPIIT',
      countryCode: 'IN',
      stateCode: 'DL',
      city: 'New Delhi',
      deliveryMode: DeliveryMode.ONLINE,
      startupStages: ['PROTOTYPE', 'MVP'],
      industries: ['SOFTWARE_IT', 'MANUFACTURING', 'CLEAN_ENERGY_CLIMATE'],
      benefitType: OpportunityBenefitType.GRANT,
      benefitAmountMin: 1000000,
      benefitAmountMax: 5000000,
      currency: 'INR',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
      officialApplicationUrl: `https://seedfund.startupindia.gov.in/apply-${runId}`,
      officialNotificationUrl: 'https://seedfund.startupindia.gov.in/guidelines.pdf',
      eligibilitySummary: 'DPIIT-recognized startup incorporated not more than 2 years ago',
      verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
      publicationStatus: PublicationStatus.PUBLISHED,
      eligibilityCriteria: [
        {
          criterionType: 'RECOGNITION',
          description: 'Must have active DPIIT Startup Recognition',
          isMandatory: true,
        },
        {
          criterionType: 'AGE',
          description: 'Incorporation period must not exceed 2 years at time of application',
          isMandatory: true,
        },
      ],
    });
    verifiedOppSlug = pubOpp.slug;

    // Attach primary source
    await prisma.opportunitySource.create({
      data: {
        opportunityId: pubOpp.id,
        sourceUrl: `https://www.startupindia.gov.in/schemes/seed-fund-${runId}`,
        sourceType: 'PRIMARY',
        isPrimarySource: true,
      },
    });

    // 2. Seed an unverified draft opportunity
    const draftOpp = await opportunitiesService.create({
      title: `Unverified Regional Grant ${runId}`,
      summary: 'Preliminary announcement extracted from forum or social page',
      category: OpportunityCategory.GRANT_FUNDING,
      governmentLevel: GovernmentLevel.STATE,
      verificationStatus: VerificationStatus.NEEDS_REVIEW,
      publicationStatus: PublicationStatus.DRAFT,
    });
    draftOppId = draftOpp.id;
    draftOppSlug = draftOpp.slug;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Public Search - only returns PUBLISHED opportunities', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/opportunities?search=${runId}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].slug).toBe(verifiedOppSlug);
    expect(res.body.items[0].publicationStatus).toBe(PublicationStatus.PUBLISHED);
  });

  it('2. Filtering by Facets - category, government level, and active deadline', async () => {
    // Matching facet
    const matchRes = await request(app.getHttpServer())
      .get(
        `/api/v1/opportunities?category=${OpportunityCategory.GOVERNMENT_SCHEME}&governmentLevel=${GovernmentLevel.CENTRAL}&deadlineStatus=ACTIVE&search=${runId}`,
      )
      .expect(200);

    expect(matchRes.body.items.length).toBe(1);
    expect(matchRes.body.items[0].slug).toBe(verifiedOppSlug);

    // Non-matching facet (e.g. HACKATHON_CHALLENGE)
    const noMatchRes = await request(app.getHttpServer())
      .get(
        `/api/v1/opportunities?category=${OpportunityCategory.HACKATHON_CHALLENGE}&search=${runId}`,
      )
      .expect(200);

    expect(noMatchRes.body.items.length).toBe(0);
  });

  it('3. Canonical Detail - retrieves full verification details, provenance sources, and criteria', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/opportunities/${verifiedOppSlug}`)
      .expect(200);

    expect(res.body.title).toContain(`Startup India Seed Fund Scheme ${runId}`);
    expect(res.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);
    expect(res.body.sources).toBeDefined();
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(res.body.sources[0].isPrimarySource).toBe(true);

    expect(res.body.eligibilityCriteria).toBeDefined();
    expect(res.body.eligibilityCriteria.length).toBe(2);
  });

  it('4. Data Privacy & Integrity - unverified DRAFT opportunity returns 404 to public', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/opportunities/${draftOppSlug}`)
      .expect(404);
  });

  it('5. Admin Verification Workflow - officially verifies draft scheme with gazette notice and audit log', async () => {
    const verifyRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/opportunities/${draftOppId}/verify`)
      .send({
        officialNotificationUrl: 'https://gazette.gov.in/notification/2026-regional-grant.pdf',
        notes: 'Verified against State Gazette Extraordinary Notification No. 412',
      })
      .expect(201);

    expect(verifyRes.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);
    expect(verifyRes.body.publicationStatus).toBe(PublicationStatus.PUBLISHED);
    expect(verifyRes.body.verifiedAt).toBeDefined();

    // Verify it is now publicly accessible
    const publicRes = await request(app.getHttpServer())
      .get(`/api/v1/opportunities/${draftOppSlug}`)
      .expect(200);

    expect(publicRes.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);

    // Verify Audit Log was recorded
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: 'VERIFY_OPPORTUNITY',
        targetId: draftOppId,
      },
    });
    expect(audit).toBeDefined();
    expect((audit?.details as any)?.notes).toContain('State Gazette');
  });

  it('6. Admin Rejection Workflow - rejects invalid/inaccurate opportunity', async () => {
    const oppToReject = await opportunitiesService.create({
      title: `Bogus Unverified Program ${runId}`,
      verificationStatus: VerificationStatus.NEEDS_REVIEW,
      publicationStatus: PublicationStatus.DRAFT,
    });

    const rejectRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/opportunities/${oppToReject.id}/reject`)
      .send({
        reason: 'Unable to locate official department notification or valid terms',
      })
      .expect(201);

    expect(rejectRes.body.verificationStatus).toBe(VerificationStatus.UNABLE_TO_VERIFY);
    expect(rejectRes.body.publicationStatus).toBe(PublicationStatus.REJECTED);
  });
});
