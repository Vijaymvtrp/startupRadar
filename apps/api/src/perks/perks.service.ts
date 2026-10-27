import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchPerksDto } from './dto/search-perks.dto';
import { CreatePerkDto } from './dto/create-perk.dto';
import { VerifyPerkDto } from './dto/verify-perk.dto';
import {
  PerkProgramStatus,
  PublicationStatus,
  VerificationStatus,
} from '@startup-radar/shared-types';
import {
  Prisma,
  StartupPerkProgram,
} from '@prisma/client';

@Injectable()
export class PerksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search and filter startup perk and credit programs
   */
  async search(dto: SearchPerksDto, includeUnpublished = false) {
    const where: Prisma.StartupPerkProgramWhereInput = {};

    // 1. Publication status filter: public search is strictly PUBLISHED
    if (!includeUnpublished) {
      where.publicationStatus = PublicationStatus.PUBLISHED;
    }

    // 2. Text Search
    if (dto.search && dto.search.trim().length > 0) {
      const q = dto.search.trim();
      where.OR = [
        { programName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { provider: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // 3. Facet Filters
    if (dto.benefitType) {
      where.benefitType = dto.benefitType;
    }

    if (dto.status) {
      where.status = dto.status;
    } else if (!includeUnpublished) {
      // Default to ACTIVE for public browsing
      where.status = PerkProgramStatus.ACTIVE;
    }

    if (dto.verificationStatus) {
      where.verificationStatus = dto.verificationStatus;
    }

    if (dto.stage) {
      where.eligibleStages = { has: dto.stage };
    }

    if (dto.countryCode) {
      where.eligibleCountries = { has: dto.countryCode };
    }

    // 4. Sorting
    let orderBy: Prisma.StartupPerkProgramOrderByWithRelationInput[] = [
      { createdAt: 'desc' },
    ];
    if (dto.sort === 'highest_value') {
      orderBy = [
        { statedValueAmount: 'desc' },
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
      this.prisma.startupPerkProgram.count({ where }),
      this.prisma.startupPerkProgram.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              officialDomain: true,
              providerType: true,
              logoUrl: true,
              verificationStatus: true,
            },
          },
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
   * Find a perk program by slug with full eligibility checklist and sources
   */
  async findBySlug(slug: string, includeUnpublished = false): Promise<StartupPerkProgram> {
    const perk = await this.prisma.startupPerkProgram.findUnique({
      where: { slug },
      include: {
        provider: true,
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

    if (!perk) {
      throw new NotFoundException(`Perk program with slug '${slug}' not found`);
    }

    if (!includeUnpublished && perk.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new NotFoundException(`Perk program with slug '${slug}' not found`);
    }

    return perk;
  }

  /**
   * Create or register a verified perk program
   */
  async create(dto: CreatePerkDto, adminUserId?: string) {
    // 1. Find or create Provider
    let provider = await this.prisma.perkProvider.findUnique({
      where: { name: dto.providerName },
    });

    if (!provider) {
      provider = await this.prisma.perkProvider.create({
        data: {
          name: dto.providerName,
          officialDomain: dto.officialDomain,
          providerType: dto.providerType || 'OTHER',
          logoUrl: dto.logoUrl,
          verificationStatus: dto.verificationStatus || VerificationStatus.PENDING,
        },
      });
    }

    // 2. Generate stable unique slug
    const slugBase = `${dto.providerName}-${dto.programName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${slugBase}-${randomSuffix}`;

    // 3. Create Program
    const program = await this.prisma.startupPerkProgram.create({
      data: {
        providerId: provider.id,
        slug,
        programName: dto.programName,
        description: dto.description,
        officialProgramUrl: dto.officialProgramUrl,
        applicationUrl: dto.applicationUrl,
        benefitType: dto.benefitType,
        statedValueAmount: dto.statedValueAmount,
        currency: dto.currency || 'USD',
        eligibleCountries: dto.eligibleCountries || ['IN'],
        eligibleStages: dto.eligibleStages || [],
        status: dto.status || PerkProgramStatus.ACTIVE,
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
        provider: true,
        eligibilityCriteria: true,
      },
    });

    // 4. Record Primary Source
    await this.prisma.perkSource.create({
      data: {
        programId: program.id,
        sourceUrl: dto.officialProgramUrl,
        sourceType: 'PRIMARY',
        isPrimarySource: true,
      },
    });

    if (adminUserId) {
      const auditUserId = await this.resolveAuditUserId(adminUserId);
      await this.prisma.auditLog.create({
        data: {
          userId: auditUserId,
          action: 'CREATE_PERK_PROGRAM',
          targetType: 'PERK_PROGRAM',
          targetId: program.id,
          details: { actor: adminUserId, programName: program.programName, slug: program.slug },
        },
      });
    }

    return program;
  }

  /**
   * Official admin verification of a perk program
   */
  async verify(id: string, adminUserId: string, dto: VerifyPerkDto) {
    const existing = await this.prisma.startupPerkProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Perk program with ID '${id}' not found`);
    }

    const updated = await this.prisma.startupPerkProgram.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        verificationNotes: dto.notes,
        officialProgramUrl: dto.officialProgramUrl || existing.officialProgramUrl,
      },
      include: {
        provider: true,
      },
    });

    // Also update provider verification status
    await this.prisma.perkProvider.update({
      where: { id: existing.providerId },
      data: { verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED },
    });

    const auditUserId = await this.resolveAuditUserId(adminUserId);
    await this.prisma.auditLog.create({
      data: {
        userId: auditUserId,
        action: 'VERIFY_PERK_PROGRAM',
        targetType: 'PERK_PROGRAM',
        targetId: id,
        details: {
          actor: adminUserId,
          notes: dto.notes,
          previousStatus: existing.verificationStatus,
        },
      },
    });

    return updated;
  }

  /**
   * Reject / withdraw inaccurate perk offer
   */
  async reject(id: string, adminUserId: string, reason: string) {
    const existing = await this.prisma.startupPerkProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Perk program with ID '${id}' not found`);
    }

    const updated = await this.prisma.startupPerkProgram.update({
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
        action: 'REJECT_PERK_PROGRAM',
        targetType: 'PERK_PROGRAM',
        targetId: id,
        details: {
          actor: adminUserId,
          reason,
          previousStatus: existing.verificationStatus,
        },
      },
    });

    return updated;
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
