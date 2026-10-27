import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OpportunityCategory,
  PublicationStatus,
  ReviewReason,
  VerificationStatus,
} from '@prisma/client';

export interface IngestItemInput {
  sourceId: string;
  sourceUrl: string;
  title: string;
  summary?: string;
  description?: string;
  organizer?: string;
  officialApplicationUrl?: string;
  applicationDeadline?: Date;
  category?: OpportunityCategory;
  contentHash?: string;
}

export interface DeduplicationResult {
  action: 'LINKED_TO_CANONICAL' | 'UPDATED_EXISTING' | 'CREATED_CANONICAL_DRAFT';
  opportunityId: string;
  slug?: string;
  matchReason?: string;
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deduplicates an ingested item against existing canonical records:
   * 1. Matches exact official application URL
   * 2. Matches normalized title + organizer
   * Links to existing record or creates a new canonical opportunity draft.
   */
  async processIngestedItem(item: IngestItemInput): Promise<DeduplicationResult> {
    const normalizedTitle = this.normalizeTitle(item.title);

    // 1. Check by exact official application URL
    if (item.officialApplicationUrl) {
      const matchByUrl = await this.prisma.opportunity.findFirst({
        where: { officialApplicationUrl: item.officialApplicationUrl },
      });

      if (matchByUrl) {
        this.logger.log(`Duplicate found by exact application URL: "${matchByUrl.title}"`);
        return this.linkSourceToOpportunity(matchByUrl.id, item, 'APPLICATION_URL_MATCH');
      }
    }

    // 2. Check by existing source URL link
    const existingSourceLink = await this.prisma.opportunitySource.findFirst({
      where: { sourceUrl: item.sourceUrl },
      include: { opportunity: true },
    });

    if (existingSourceLink) {
      this.logger.log(`Existing source page update for opportunity: "${existingSourceLink.opportunity.title}"`);
      return this.checkAndUpdateExisting(existingSourceLink.opportunity.id, item);
    }

    // 3. Check by normalized title
    const candidates = await this.prisma.opportunity.findMany({
      where: {
        category: item.category || OpportunityCategory.GOVERNMENT_SCHEME,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const matchingCandidate = candidates.find((cand) => {
      const candNorm = this.normalizeTitle(cand.title);
      return candNorm === normalizedTitle;
    });

    if (matchingCandidate) {
      this.logger.log(`Duplicate found by title match: "${matchingCandidate.title}"`);
      // If deadlines conflict by > 1 day, route to review queue for human verification
      const hasConflict =
        item.applicationDeadline &&
        matchingCandidate.applicationDeadline &&
        Math.abs(item.applicationDeadline.getTime() - matchingCandidate.applicationDeadline.getTime()) >
          24 * 60 * 60 * 1000;

      if (hasConflict) {
        await this.prisma.reviewQueueItem.create({
          data: {
            opportunityId: matchingCandidate.id,
            reason: ReviewReason.CONFLICTING_DATA,
            reviewerNotes: `Conflicting deadlines detected between source "${item.sourceUrl}" and canonical record.`,
            details: {
              newSourceUrl: item.sourceUrl,
              reportedDeadline: item.applicationDeadline,
              canonicalDeadline: matchingCandidate.applicationDeadline,
            },
          },
        });
      }

      return this.linkSourceToOpportunity(matchingCandidate.id, item, 'TITLE_MATCH');
    }

    // 4. No duplicate found -> Create new Canonical Opportunity Draft
    return this.createCanonicalDraft(item);
  }

  private async linkSourceToOpportunity(
    opportunityId: string,
    item: IngestItemInput,
    matchReason: string,
  ): Promise<DeduplicationResult> {
    const existingLink = await this.prisma.opportunitySource.findUnique({
      where: {
        opportunityId_sourceUrl: {
          opportunityId,
          sourceUrl: item.sourceUrl,
        },
      },
    });

    if (existingLink) {
      await this.prisma.opportunitySource.update({
        where: { id: existingLink.id },
        data: {
          lastSeenAt: new Date(),
          contentHash: item.contentHash || existingLink.contentHash,
        },
      });
    } else {
      let validSourceId: string | null = null;
      if (item.sourceId) {
        const exists = await this.prisma.source.findUnique({ where: { id: item.sourceId } });
        if (exists) validSourceId = item.sourceId;
      }

      await this.prisma.opportunitySource.create({
        data: {
          opportunityId,
          sourceId: validSourceId,
          sourceUrl: item.sourceUrl,
          sourceType: 'SECONDARY',
          isPrimarySource: false,
          contentHash: item.contentHash,
        },
      });
    }

    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { lastSeenAt: new Date() },
    });

    return {
      action: 'LINKED_TO_CANONICAL' as const,
      opportunityId,
      matchReason,
    };
  }

  private async checkAndUpdateExisting(opportunityId: string, item: IngestItemInput): Promise<DeduplicationResult> {
    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        lastSeenAt: new Date(),
        applicationDeadline: item.applicationDeadline || undefined,
      },
    });

    return {
      action: 'UPDATED_EXISTING' as const,
      opportunityId,
    };
  }

  private async createCanonicalDraft(item: IngestItemInput): Promise<DeduplicationResult> {
    const slug = await this.generateUniqueSlug(item.title);

    let validSourceId: string | null = null;
    if (item.sourceId) {
      const exists = await this.prisma.source.findUnique({ where: { id: item.sourceId } });
      if (exists) validSourceId = item.sourceId;
    }

    const opportunity = await this.prisma.opportunity.create({
      data: {
        slug,
        title: item.title.trim(),
        summary: item.summary?.trim() || item.title.trim(),
        description: item.description?.trim(),
        organizer: item.organizer?.trim(),
        category: item.category || OpportunityCategory.GOVERNMENT_SCHEME,
        officialApplicationUrl: item.officialApplicationUrl || item.sourceUrl,
        applicationDeadline: item.applicationDeadline,
        verificationStatus: VerificationStatus.PENDING,
        publicationStatus: PublicationStatus.DRAFT,
        sources: {
          create: {
            sourceId: validSourceId,
            sourceUrl: item.sourceUrl,
            sourceType: 'PRIMARY',
            isPrimarySource: true,
            contentHash: item.contentHash,
          },
        },
      },
    });

    return {
      action: 'CREATED_CANONICAL_DRAFT' as const,
      opportunityId: opportunity.id,
      slug: opportunity.slug,
    };
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${baseSlug}-${randomSuffix}`;
    return candidate;
  }
}
