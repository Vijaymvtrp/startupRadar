import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationalMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Source Freshness & Ingestion Health
    const [totalSources, activeSources, freshSources24h, staleSources] =
      await Promise.all([
        this.prisma.source.count(),
        this.prisma.source.count({ where: { isEnabled: true } }),
        this.prisma.source.count({
          where: { lastCheckedAt: { gte: oneDayAgo } },
        }),
        this.prisma.source.count({
          where: {
            OR: [{ lastCheckedAt: { lt: sevenDaysAgo } }, { lastCheckedAt: null }],
          },
        }),
      ]);

    // 2. Opportunities Quality & Verification
    const [
      totalOpportunities,
      publishedOpportunities,
      verifiedOpportunities,
      pendingReviewItems,
    ] = await Promise.all([
      this.prisma.opportunity.count(),
      this.prisma.opportunity.count({
        where: { publicationStatus: 'PUBLISHED' },
      }),
      this.prisma.opportunity.count({
        where: { verificationStatus: 'OFFICIALLY_VERIFIED' },
      }),
      this.prisma.reviewQueueItem.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // 3. Perks & Benefits Quality
    const [totalPerkPrograms, activePerkPrograms, verifiedPerkPrograms] =
      await Promise.all([
        this.prisma.startupPerkProgram.count(),
        this.prisma.startupPerkProgram.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.startupPerkProgram.count({
          where: { verificationStatus: 'OFFICIALLY_VERIFIED' },
        }),
      ]);

    // 4. Co-Founder Matching
    const [
      totalFounders,
      activeFounderProfiles,
      totalConnectionRequests,
      acceptedConnections,
    ] = await Promise.all([
      this.prisma.founderProfile.count(),
      this.prisma.founderProfile.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.connectionRequest.count(),
      this.prisma.connectionRequest.count({
        where: { status: 'ACCEPTED' },
      }),
    ]);

    // 5. Intelligence Engine & Founder Feedback
    const [
      totalRecommendationRuns,
      totalRecommendations,
      totalFeedbackRecords,
      relevantFeedbackCount,
    ] = await Promise.all([
      this.prisma.recommendationRun.count(),
      this.prisma.recommendation.count(),
      this.prisma.recommendationFeedbackRecord.count(),
      this.prisma.recommendationFeedbackRecord.count({
        where: { feedback: 'RELEVANT' },
      }),
    ]);

    // 6. Database Latency Check
    const startDb = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startDb;
    } catch (err: any) {
      dbStatus = `unreachable: ${err.message}`;
    }

    return {
      timestamp: new Date().toISOString(),
      sourceFreshness: {
        totalSources,
        activeSources,
        freshSources24h,
        staleSources,
        freshnessRate:
          activeSources > 0
            ? Math.round((freshSources24h / activeSources) * 100)
            : 100,
      },
      opportunities: {
        totalOpportunities,
        publishedOpportunities,
        verifiedOpportunities,
        verificationRate:
          publishedOpportunities > 0
            ? Math.round(
                (verifiedOpportunities / publishedOpportunities) * 100,
              )
            : 0,
        pendingReviewItems,
      },
      perks: {
        totalPerkPrograms,
        activePerkPrograms,
        verifiedPerkPrograms,
      },
      founderMatching: {
        totalFounders,
        activeFounderProfiles,
        totalConnectionRequests,
        acceptedConnections,
      },
      intelligence: {
        totalRecommendationRuns,
        totalRecommendations,
        totalFeedbackRecords,
        relevantFeedbackCount,
        relevanceQualityScore:
          totalFeedbackRecords > 0
            ? Math.round((relevantFeedbackCount / totalFeedbackRecords) * 100)
            : 100,
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryUsageMb: Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024,
        ),
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    };
  }
}
