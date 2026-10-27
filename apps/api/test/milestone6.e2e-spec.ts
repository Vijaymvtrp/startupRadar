import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AlertFrequency,
  ApplicationStatus,
  DeliveryMode,
  GovernmentLevel,
  OpportunityBenefitType,
  OpportunityCategory,
  PerkBenefitType,
  PerkProgramStatus,
  PublicationStatus,
  VerificationStatus,
} from '@startup-radar/shared-types';

describe('Milestone 6 - Founder Accounts, Saved Items & Deadline Alerts (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  let tokenA: string;
  let userAId: string;
  let tokenB: string;
  let userBId: string;

  let testOppId: string;
  let testPerkId: string;
  let trackingIdA: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Register User A
    const regResA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `founder_a_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Founder Alpha',
        location: 'Bengaluru, Karnataka',
      })
      .expect(201);

    tokenA = regResA.body.accessToken;
    userAId = regResA.body.user.id;

    // 2. Register User B
    const regResB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `founder_b_${runId}@example.com`,
        password: 'Password123!',
        fullName: 'Founder Beta',
        location: 'Hyderabad, Telangana',
      })
      .expect(201);

    tokenB = regResB.body.accessToken;
    userBId = regResB.body.user.id;

    // 3. Seed an Opportunity closing in 5 days
    const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const opp = await prisma.opportunity.create({
      data: {
        slug: `ms6-opp-${runId}`,
        title: `MS6 Agritech Innovation Challenge ${runId}`,
        summary: 'Direct grants for seed-stage precision agritech prototypes.',
        category: OpportunityCategory.GRANT_FUNDING,
        governmentLevel: GovernmentLevel.CENTRAL,
        deliveryMode: DeliveryMode.ONLINE,
        benefitType: OpportunityBenefitType.GRANT,
        benefitAmountMin: 1000000,
        benefitAmountMax: 2500000,
        currency: 'INR',
        applicationDeadline: deadline,
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
        startupStages: ['PROTOTYPE', 'MVP'],
        industries: ['AGRICULTURE'],
      },
    });
    testOppId = opp.id;

    // 4. Seed a Perk Program
    const provider = await prisma.perkProvider.create({
      data: {
        name: `Cloud Provider MS6 ${runId}`,
        officialDomain: `cloud-${runId}.io`,
      },
    });

    const perk = await prisma.startupPerkProgram.create({
      data: {
        providerId: provider.id,
        slug: `ms6-cloud-perk-${runId}`,
        programName: `Cloud Accelerator Credits ${runId}`,
        description: '$25,000 in compute credits and architecture consulting.',
        officialProgramUrl: `https://cloud-${runId}.io/startups`,
        benefitType: PerkBenefitType.CLOUD_CREDITS,
        statedValueAmount: 25000,
        currency: 'USD',
        status: PerkProgramStatus.ACTIVE,
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
    });
    testPerkId = perk.id;
  });

  afterAll(async () => {
    // Cleanup seed opportunities and perks
    await prisma.savedOpportunity.deleteMany({ where: { opportunityId: testOppId } });
    await prisma.savedPerk.deleteMany({ where: { perkProgramId: testPerkId } });
    await prisma.applicationTracking.deleteMany({ where: { opportunityId: testOppId } });
    await prisma.opportunity.deleteMany({ where: { id: testOppId } });
    await prisma.startupPerkProgram.deleteMany({ where: { id: testPerkId } });
    await app.close();
  });

  // -------------------------------------------------------------
  // Test 1: Saved Opportunities
  // -------------------------------------------------------------
  it('1. POST /api/v1/me/saved-opportunities - should save opportunity and prevent duplicates', async () => {
    // Save opportunity
    const saveRes = await request(app.getHttpServer())
      .post('/api/v1/me/saved-opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        opportunityId: testOppId,
        notes: 'Check submission documents by Friday',
      })
      .expect(201);

    expect(saveRes.body.opportunityId).toBe(testOppId);
    expect(saveRes.body.notes).toBe('Check submission documents by Friday');

    // Duplicate save should upsert idempotently without error
    await request(app.getHttpServer())
      .post('/api/v1/me/saved-opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        opportunityId: testOppId,
        notes: 'Updated personal note',
      })
      .expect(201);

    // List saved opportunities
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/me/saved-opportunities')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].opportunity.id).toBe(testOppId);
    expect(listRes.body[0].opportunity.title).toContain('MS6 Agritech Innovation Challenge');
  });

  // -------------------------------------------------------------
  // Test 2: Saved Perks
  // -------------------------------------------------------------
  it('2. POST /api/v1/me/saved-perks - should save and list perks with provider details', async () => {
    const saveRes = await request(app.getHttpServer())
      .post('/api/v1/me/saved-perks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        perkProgramId: testPerkId,
        notes: 'Apply after MVP launch',
      })
      .expect(201);

    expect(saveRes.body.perkProgramId).toBe(testPerkId);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/me/saved-perks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].perkProgram.id).toBe(testPerkId);
    expect(listRes.body[0].perkProgram.provider.name).toContain('Cloud Provider MS6');

    // Unsave perk
    await request(app.getHttpServer())
      .delete(`/api/v1/me/saved-perks/${testPerkId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const emptyRes = await request(app.getHttpServer())
      .get('/api/v1/me/saved-perks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(emptyRes.body.length).toBe(0);
  });

  // -------------------------------------------------------------
  // Test 3: Private Application Tracking & Ownership Isolation
  // -------------------------------------------------------------
  it('3. Private Application Tracking - should enforce strict user ownership and privacy isolation', async () => {
    // User A creates application tracking entry
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/me/application-tracking')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        opportunityId: testOppId,
        status: ApplicationStatus.APPLIED,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        privateNotes: 'Confidential strategy presentation submitted to screening committee',
      })
      .expect(201);

    trackingIdA = createRes.body.id;
    expect(createRes.body.status).toBe(ApplicationStatus.APPLIED);
    expect(createRes.body.privateNotes).toContain('Confidential strategy');

    // User A updates status to UNDER_REVIEW
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/me/application-tracking/${trackingIdA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        status: ApplicationStatus.UNDER_REVIEW,
      })
      .expect(200);

    expect(updateRes.body.status).toBe(ApplicationStatus.UNDER_REVIEW);

    // PRIVACY ENFORCEMENT: User B attempts to access/update User A's tracking record -> 403 Forbidden!
    await request(app.getHttpServer())
      .patch(`/api/v1/me/application-tracking/${trackingIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        status: ApplicationStatus.REJECTED,
      })
      .expect(403);

    // User B listing their tracked applications -> User A's records are NOT returned
    const userBList = await request(app.getHttpServer())
      .get('/api/v1/me/application-tracking')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(userBList.body.length).toBe(0);
  });

  // -------------------------------------------------------------
  // Test 4: User Notification Preferences
  // -------------------------------------------------------------
  it('4. User Preferences - should read and update notification alert settings', async () => {
    // Read default preferences
    const prefRes = await request(app.getHttpServer())
      .get('/api/v1/me/preferences')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(prefRes.body.emailAlertsEnabled).toBe(true);
    expect(prefRes.body.alertFrequency).toBe(AlertFrequency.DAILY);

    // Update preferences to INSTANT alerts
    const updatePrefRes = await request(app.getHttpServer())
      .put('/api/v1/me/preferences')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        emailAlertsEnabled: true,
        alertFrequency: AlertFrequency.INSTANT,
        deadlineAlertDays: [7, 3, 1],
      })
      .expect(200);

    expect(updatePrefRes.body.alertFrequency).toBe(AlertFrequency.INSTANT);
    expect(updatePrefRes.body.deadlineAlertDays).toEqual([7, 3, 1]);
  });

  // -------------------------------------------------------------
  // Test 5: Deadline Alerts Processing & Deduplication
  // -------------------------------------------------------------
  it('5. Deadline Alerts Engine - should process approaching deadlines, deduplicate alerts, and respect unsubscribe', async () => {
    // Run 1: Should dispatch deadline alert for User A's saved opportunity (closing in 5 days)
    const run1Res = await request(app.getHttpServer())
      .post('/api/v1/admin/alerts/process-deadlines')
      .expect(201);

    expect(run1Res.body.success).toBe(true);
    expect(run1Res.body.dispatchedCount).toBeGreaterThanOrEqual(1);

    // Run 2: Same trigger should deduplicate and NOT send duplicate alert
    const run2Res = await request(app.getHttpServer())
      .post('/api/v1/admin/alerts/process-deadlines')
      .expect(201);

    expect(run2Res.body.skippedCount).toBeGreaterThanOrEqual(1);

    // Unsubscribe User A
    await request(app.getHttpServer())
      .put('/api/v1/me/preferences')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        isUnsubscribed: true,
      })
      .expect(200);

    // Reset notification records for User A to test suppression
    await prisma.userAlertNotification.deleteMany({ where: { userId: userAId } });

    // Run 3: Should suppress alerts for unsubscribed user
    const run3Res = await request(app.getHttpServer())
      .post('/api/v1/admin/alerts/process-deadlines')
      .expect(201);

    const userASuppressed = run3Res.body.results.find((r: any) => r.userId === userAId);
    expect(userASuppressed?.status).toBe('SUPPRESSED_UNSUBSCRIBED');
  });

  // -------------------------------------------------------------
  // Test 6: Account Deletion (GDPR & Data Privacy)
  // -------------------------------------------------------------
  it('6. DELETE /api/v1/me/account - should delete user account and cascade private tracking data', async () => {
    // Delete User A account
    const delRes = await request(app.getHttpServer())
      .delete('/api/v1/me/account')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(delRes.body.success).toBe(true);

    // Verify user and cascaded data no longer exist
    const userInDb = await prisma.user.findUnique({ where: { id: userAId } });
    expect(userInDb).toBeNull();

    const savedInDb = await prisma.savedOpportunity.findMany({ where: { userId: userAId } });
    expect(savedInDb.length).toBe(0);

    const trackingInDb = await prisma.applicationTracking.findMany({ where: { userId: userAId } });
    expect(trackingInDb.length).toBe(0);
  });
});
