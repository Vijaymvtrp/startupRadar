import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ChangeDetectionService } from '../src/change-detection/change-detection.service';
import { DeduplicationService } from '../src/deduplication/deduplication.service';
import { ReviewQueueService } from '../src/review-queue/review-queue.service';
import { OpportunityCategory, PublicationStatus, ReviewStatus, VerificationStatus } from '@prisma/client';

describe('Milestone 3 - Change Detection, Deduplication & Data Quality (E2E)', () => {
  let app: INestApplication;
  let changeDetection: ChangeDetectionService;
  let deduplication: DeduplicationService;
  let reviewQueue: ReviewQueueService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    changeDetection = app.get(ChangeDetectionService);
    deduplication = app.get(DeduplicationService);
    reviewQueue = app.get(ReviewQueueService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Content Normalization - should strip volatile HTML, scripts, ads, and produce stable hashes', () => {
    const rawHtml1 = `
      <html>
        <head><script>var randomCounter = 948273;</script></head>
        <body>
          <nav>Home | About | Contact</nav>
          <div class="ad">Buy stuff!</div>
          <h1>National Deep Tech Startup Grant 2026</h1>
          <p>Eligible startups receive up to 50 Lakhs funding.</p>
          <footer>Copyright 2026. Loaded at 10:45 AM</footer>
        </body>
      </html>
    `;

    const rawHtml2 = `
      <html>
        <head><script>var randomCounter = 111111;</script></head>
        <body>
          <nav>Home | Updated Nav | Contact</nav>
          <div class="ad">Different Ad Banner</div>
          <h1>National Deep Tech Startup Grant 2026</h1>
          <p>Eligible startups receive up to 50 Lakhs funding.</p>
          <footer>Copyright 2026. Loaded at 11:20 AM</footer>
        </body>
      </html>
    `;

    const norm1 = changeDetection.normalizeContent(rawHtml1);
    const norm2 = changeDetection.normalizeContent(rawHtml2);

    expect(norm1).toBe(norm2);
    expect(changeDetection.computeHash(norm1)).toBe(changeDetection.computeHash(norm2));
  });

  const runId = Date.now();
  const testTitle = `DST Seed Support Scheme ${runId}`;
  const testApplyUrl = `https://dst.gov.in/apply/seed-${runId}`;
  let createdOppId: string;

  it('2. Deduplication - should create canonical record for a new announcement', async () => {
    const res = await deduplication.processIngestedItem({
      sourceId: 'src-test-1',
      sourceUrl: `https://dst.gov.in/schemes/seed-fund-${runId}`,
      title: testTitle,
      summary: 'Financial assistance for innovative science & technology startups',
      organizer: 'Department of Science and Technology',
      officialApplicationUrl: testApplyUrl,
      applicationDeadline: new Date('2026-12-31'),
      category: OpportunityCategory.GRANT_FUNDING,
    });

    expect(res.action).toBe('CREATED_CANONICAL_DRAFT');
    expect(res.opportunityId).toBeDefined();
    createdOppId = res.opportunityId!;
  });

  it('3. Deduplication - should link secondary source URL to the same canonical record without duplication', async () => {
    const res = await deduplication.processIngestedItem({
      sourceId: 'src-aggregator-2',
      sourceUrl: `https://startup-aggregator.in/opportunities/dst-seed-${runId}`,
      title: testTitle, // same title
      officialApplicationUrl: testApplyUrl, // exact same official apply URL
      category: OpportunityCategory.GRANT_FUNDING,
    });

    expect(res.action).toBe('LINKED_TO_CANONICAL');
    expect(res.matchReason).toBe('APPLICATION_URL_MATCH');
    expect(res.opportunityId).toBe(createdOppId);
  });

  it('4. Data Quality & Conflicts - should route conflicting deadlines to Review Queue', async () => {
    const res = await deduplication.processIngestedItem({
      sourceId: 'src-aggregator-3',
      sourceUrl: `https://another-feed.in/dst-seed-grant-${runId}`,
      title: testTitle,
      applicationDeadline: new Date('2027-04-15'), // Conflicting deadline (> 1 day difference)
      category: OpportunityCategory.GRANT_FUNDING,
    });

    expect(res.action).toBe('LINKED_TO_CANONICAL');

    // Verify item in Review Queue
    const queue = await reviewQueue.listQueue();
    const conflictItem = queue.find((q) => q.opportunityId === res.opportunityId);
    expect(conflictItem).toBeDefined();
    expect(conflictItem?.reason).toBe('CONFLICTING_DATA');
  });

  it('5. Review Queue Approval - admin can approve and officially publish verified record', async () => {
    const queue = await reviewQueue.listQueue();
    expect(queue.length).toBeGreaterThan(0);

    const targetItem = queue.find((q) => q.opportunityId === createdOppId) || queue[0];
    const approveRes = await reviewQueue.approve(targetItem.id, 'Verified via official DST Gazette notification');

    expect(approveRes.opportunity.verificationStatus).toBe(VerificationStatus.OFFICIALLY_VERIFIED);
    expect(approveRes.opportunity.publicationStatus).toBe(PublicationStatus.PUBLISHED);
  });
});
