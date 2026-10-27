import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DeadlineFilter,
  SearchOpportunitiesDto,
} from './dto/search-opportunities.dto';
import {
  CreateOpportunityDto,
} from './dto/create-opportunity.dto';
import {
  VerifyOpportunityDto,
} from './dto/verify-opportunity.dto';
import {
  Opportunity,
  Prisma,
  PublicationStatus,
  ReviewStatus,
  VerificationStatus,
} from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search and filter canonical opportunities with pagination
   */
  async search(dto: SearchOpportunitiesDto, includeUnpublished = false) {
    const where: Prisma.OpportunityWhereInput = {};

    // 1. Publication status filter: public search is strictly PUBLISHED by default
    if (!includeUnpublished) {
      where.publicationStatus = PublicationStatus.PUBLISHED;
    }

    // 2. Text Search (title, summary, organizer)
    if (dto.search && dto.search.trim().length > 0) {
      const q = dto.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { organizer: { contains: q, mode: 'insensitive' } },
        { departmentName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 3. Facet Filters
    if (dto.category) {
      where.category = dto.category;
    }

    if (dto.governmentLevel) {
      where.governmentLevel = dto.governmentLevel;
    }

    if (dto.benefitType) {
      where.benefitType = dto.benefitType;
    }

    if (dto.deliveryMode) {
      where.deliveryMode = dto.deliveryMode;
    }

    if (dto.countryCode) {
      where.countryCode = dto.countryCode;
    }

    if (dto.stateCode) {
      where.stateCode = dto.stateCode;
    }

    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' };
    }

    if (dto.stage) {
      where.startupStages = { has: dto.stage };
    }

    if (dto.industry) {
      where.industries = { has: dto.industry };
    }

    if (dto.verificationStatus) {
      where.verificationStatus = dto.verificationStatus;
    }

    // 4. Deadline status filter
    const now = new Date();
    if (dto.deadlineStatus === DeadlineFilter.ACTIVE) {
      where.AND = [
        {
          OR: [
            { applicationDeadline: { gte: now } },
            { applicationDeadline: null },
          ],
        },
      ];
    } else if (dto.deadlineStatus === DeadlineFilter.CLOSING_SOON) {
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.applicationDeadline = {
        gte: now,
        lte: in7Days,
      };
    } else if (dto.deadlineStatus === DeadlineFilter.EXPIRED) {
      where.applicationDeadline = {
        lt: now,
      };
    }

    // 5. Sorting
    let orderBy: Prisma.OpportunityOrderByWithRelationInput[] = [
      { createdAt: 'desc' },
    ];
    if (dto.sort === 'closing_soon') {
      orderBy = [
        { applicationDeadline: 'asc' },
        { createdAt: 'desc' },
      ];
    } else if (dto.sort === 'recently_verified') {
      orderBy = [
        { verifiedAt: 'desc' },
        { createdAt: 'desc' },
      ];
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sources: {
            where: { isPrimarySource: true },
            take: 1,
            select: {
              sourceUrl: true,
              sourceType: true,
              lastSeenAt: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    };
  }

  /**
   * Find opportunity by slug with source attribution and eligibility criteria
   */
  async findBySlug(slug: string, includeUnpublished = false): Promise<Opportunity> {
    const opp = await this.prisma.opportunity.findUnique({
      where: { slug },
      include: {
        sources: {
          orderBy: { isPrimarySource: 'desc' },
          select: {
            id: true,
            sourceUrl: true,
            sourceType: true,
            isPrimarySource: true,
            firstSeenAt: true,
            lastSeenAt: true,
          },
        },
        eligibilityCriteria: {
          select: {
            id: true,
            criterionType: true,
            description: true,
            isMandatory: true,
          },
        },
      },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity with slug '${slug}' not found`);
    }

    if (!includeUnpublished && opp.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new NotFoundException(`Opportunity with slug '${slug}' not found`);
    }

    return opp;
  }

  /**
   * Admin official verification workflow
   */
  async verify(id: string, adminUserId: string, dto: VerifyOpportunityDto) {
    const existing = await this.prisma.opportunity.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Opportunity with ID '${id}' not found`);
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        verificationNotes: dto.notes,
        officialNotificationUrl: dto.officialNotificationUrl || existing.officialNotificationUrl,
      },
    });

    // Write audit log
    const auditUserId = await this.resolveAuditUserId(adminUserId);
    await this.prisma.auditLog.create({
      data: {
        userId: auditUserId,
        action: 'VERIFY_OPPORTUNITY',
        targetType: 'OPPORTUNITY',
        targetId: id,
        details: {
          actor: adminUserId,
          previousStatus: existing.verificationStatus,
          notes: dto.notes,
          officialNotificationUrl: dto.officialNotificationUrl,
        },
      },
    });

    // Auto-resolve pending review items
    await this.prisma.reviewQueueItem.updateMany({
      where: {
        opportunityId: id,
        status: ReviewStatus.PENDING,
      },
      data: {
        status: ReviewStatus.APPROVED,
        reviewerNotes: dto.notes ? `Verified: ${dto.notes}` : 'Officially verified by admin',
        resolvedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Admin rejection / withdrawal workflow
   */
  async reject(id: string, adminUserId: string, reason: string) {
    const existing = await this.prisma.opportunity.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Opportunity with ID '${id}' not found`);
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.UNABLE_TO_VERIFY,
        publicationStatus: PublicationStatus.REJECTED,
        verificationNotes: reason,
      },
    });

    const auditUserId = await this.resolveAuditUserId(adminUserId);
    await this.prisma.auditLog.create({
      data: {
        userId: auditUserId,
        action: 'REJECT_OPPORTUNITY',
        targetType: 'OPPORTUNITY',
        targetId: id,
        details: {
          actor: adminUserId,
          reason,
          previousStatus: existing.verificationStatus,
        },
      },
    });

    await this.prisma.reviewQueueItem.updateMany({
      where: {
        opportunityId: id,
        status: ReviewStatus.PENDING,
      },
      data: {
        status: ReviewStatus.REJECTED,
        reviewerNotes: reason,
        resolvedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Create an opportunity (Admin / Verified Ingestion)
   */
  async create(dto: CreateOpportunityDto, adminUserId?: string) {
    const slugBase = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${slugBase}-${randomSuffix}`;

    const opp = await this.prisma.opportunity.create({
      data: {
        slug,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        organizer: dto.organizer,
        category: dto.category,
        governmentLevel: dto.governmentLevel,
        departmentName: dto.departmentName,
        countryCode: dto.countryCode || 'IN',
        stateCode: dto.stateCode,
        city: dto.city,
        deliveryMode: dto.deliveryMode,
        startupStages: dto.startupStages || [],
        industries: dto.industries || [],
        benefitType: dto.benefitType,
        benefitAmountMin: dto.benefitAmountMin,
        benefitAmountMax: dto.benefitAmountMax,
        currency: dto.currency || 'INR',
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
        officialApplicationUrl: dto.officialApplicationUrl,
        officialNotificationUrl: dto.officialNotificationUrl,
        eligibilitySummary: dto.eligibilitySummary,
        verificationStatus: dto.verificationStatus || VerificationStatus.PENDING,
        publicationStatus: dto.publicationStatus || PublicationStatus.DRAFT,
        eligibilityCriteria: dto.eligibilityCriteria?.length
          ? {
              create: dto.eligibilityCriteria.map((c) => ({
                criterionType: c.criterionType,
                description: c.description,
                isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
              })),
            }
          : undefined,
      },
      include: {
        eligibilityCriteria: true,
      },
    });

    if (adminUserId) {
      const auditUserId = await this.resolveAuditUserId(adminUserId);
      await this.prisma.auditLog.create({
        data: {
          userId: auditUserId,
          action: 'CREATE_OPPORTUNITY',
          targetType: 'OPPORTUNITY',
          targetId: opp.id,
          details: { actor: adminUserId, title: opp.title, slug: opp.slug },
        },
      });
    }

    return opp;
  }

  private async resolveAuditUserId(adminUserId?: string): Promise<string | null> {
    if (!adminUserId) return null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      });
      return user ? user.id : null;
    } catch {
      return null;
    }
  }
}
