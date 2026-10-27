import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PerksService } from '../src/perks/perks.service';
import {
  PerkBenefitType,
  PerkProgramStatus,
  PublicationStatus,
  VerificationStatus,
} from '@startup-radar/shared-types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Milestone 5 - Startup Perks & Credits MVP (E2E)', () => {
  let app: INestApplication;
  let perksService: PerksService;
  let prisma: PrismaService;

  const runId = Date.now();
  let verifiedPerkSlug: string;
  let draftPerkId: string;
  let draftPerkSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    perksService = app.get(PerksService);
    prisma = app.get(PrismaService);

    // 1. Seed a verified published perk program
    const pubPerk = await perksService.create({
      providerName: `Amazon Web Services ${runId}`,
      officialDomain: 'aws.amazon.com',
      providerType: 'CLOUD_INFRASTRUCTURE',
      logoUrl: 'https://aws.amazon.com/favicon.ico',
      programName: `AWS Activate Portfolio ${runId}`,
      description:
        'Up to $100,000 in AWS promotional credits for funded startups, plus technical support and business mentoring.',
      officialProgramUrl: `https://aws.amazon.com/activate/portfolio-${runId}`,
      applicationUrl: `https://console.aws.amazon.com/activate/apply-${runId}`,
      benefitType: PerkBenefitType.CLOUD_CREDITS,
      statedValueAmount: 100000,
      currency: 'USD',
      eligibleCountries: ['IN', 'US', 'SG'],
      eligibleStages: ['SEED', 'FIRST_CUSTOMERS'],
      status: PerkProgramStatus.ACTIVE,
      verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
      publicationStatus: PublicationStatus.PUBLISHED,
      eligibilityCriteria: [
        {
          criterionType: 'AFFILIATION',
          description: 'Must be associated with an approved AWS Activate Partner incubator or VC',
          isMandatory: true,
        },
        {
          criterionType: 'PRIOR_CREDITS',
          description: 'Startup must not have exceeded $100,000 in lifetime AWS credits',
          isMandatory: true,
        },
      ],
    });
    verifiedPerkSlug = pubPerk.slug;

    // 2. Seed an unverified draft perk program
    const draftPerk = await perksService.create({
      providerName: `Unknown AI Lab ${runId}`,
      officialDomain: 'unknown-ai.io',
      programName: `Free GPU Credits Offer ${runId}`,
      officialProgramUrl: `https://unknown-ai.io/promo-${runId}`,
      benefitType: PerkBenefitType.AI_API_CREDITS,
      verificationStatus: VerificationStatus.NEEDS_REVIEW,
      publicationStatus: PublicationStatus.DRAFT,
    });
    draftPerkId = draftPerk.id;
    draftPerkSlug = draftPerk.slug;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Public Search - only returns PUBLISHED perk programs', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/perks?search=${runId}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].slug).toBe(verifiedPerkSlug);
    expect(res.body.items[0].publicationStatus).toBe(PublicationStatus.PUBLISHED);
    expect(res.body.items[0].provider.name).toContain('Amazon Web Services');
  });

  it('2. Filtering by Facets - benefit type and status', async () => {
    // Matching facet (CLOUD_CREDITS)
    const matchRes = await request(app.getHttpServer())
      .get(`/api/v1/perks?benefitType=${PerkBenefitType.CLOUD_CREDITS}&search=${runId}`)
      .expect(200);

    expect(matchRes.body.items.length).toBe(1);
    expect(matchRes.body.items[0].slug).toBe(verifiedPerkSlug);

    // Non-matching facet (DEVELOPER_TOOL)
    const noMatchRes = await request(app.getHttpServer())
      .get(`/api/v1/perks?benefitType=${PerkBenefitType.DEVELOPER_TOOL}&search=${runId}`)
      .expect(200);

    expect(noMatchRes.body.items.length).toBe(0);
  });

  it('3. Canonical Detail - retrieves full verification details, provider, and eligibility checklist', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/perks/${verifiedPerkSlug}`)
      .expect(200);

    expect(res.body.programName).toContain(`AWS Activate Portfolio ${runId}`);
    expect(res.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);
    expect(res.body.provider).toBeDefined();
    expect(res.body.sources).toBeDefined();
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(res.body.sources[0].isPrimarySource).toBe(true);

    expect(res.body.eligibilityCriteria).toBeDefined();
    expect(res.body.eligibilityCriteria.length).toBe(2);
  });

  it('4. Data Privacy & Integrity - unverified DRAFT perk returns 404 to public', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/perks/${draftPerkSlug}`)
      .expect(404);
  });

  it('5. Admin Verification Workflow - officially verifies draft perk and logs audit event', async () => {
    const verifyRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/perks/${draftPerkId}/verify`)
      .send({
        notes: 'Verified against official partner portal terms and active credit quota',
      })
      .expect(201);

    expect(verifyRes.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);
    expect(verifyRes.body.publicationStatus).toBe(PublicationStatus.PUBLISHED);
    expect(verifyRes.body.verifiedAt).toBeDefined();

    // Verify it is now publicly accessible
    const publicRes = await request(app.getHttpServer())
      .get(`/api/v1/perks/${draftPerkSlug}`)
      .expect(200);

    expect(publicRes.body.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);

    // Verify Audit Log
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: 'VERIFY_PERK_PROGRAM',
        targetId: draftPerkId,
      },
    });
    expect(audit).toBeDefined();
  });

  it('6. Admin Rejection Workflow - rejects/withdraws expired or invalid perk program', async () => {
    const perkToReject = await perksService.create({
      providerName: `Expired SaaS Tool ${runId}`,
      officialDomain: 'expired-saas.com',
      programName: `Defunct Discount Code ${runId}`,
      officialProgramUrl: `https://expired-saas.com/code-${runId}`,
      verificationStatus: VerificationStatus.NEEDS_REVIEW,
      publicationStatus: PublicationStatus.DRAFT,
    });

    const rejectRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/perks/${perkToReject.id}/reject`)
      .send({
        reason: 'Offer discontinued by provider',
      })
      .expect(201);

    expect(rejectRes.body.verificationStatus).toBe(VerificationStatus.UNABLE_TO_VERIFY);
    expect(rejectRes.body.publicationStatus).toBe(PublicationStatus.REJECTED);
  });
});
