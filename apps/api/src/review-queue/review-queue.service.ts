import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStatus, ReviewStatus, VerificationStatus } from '@prisma/client';

@Injectable()
export class ReviewQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async listQueue(status: ReviewStatus = ReviewStatus.PENDING) {
    return this.prisma.reviewQueueItem.findMany({
      where: { status },
      include: {
        opportunity: {
          include: {
            sources: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, notes?: string) {
    const item = await this.prisma.reviewQueueItem.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!item) {
      throw new NotFoundException(`Review queue item ${id} not found`);
    }

    // Update review item
    await this.prisma.reviewQueueItem.update({
      where: { id },
      data: {
        status: ReviewStatus.APPROVED,
        reviewerNotes: notes,
        resolvedAt: new Date(),
      },
    });

    // Verify and publish opportunity
    const updatedOpp = await this.prisma.opportunity.update({
      where: { id: item.opportunityId },
      data: {
        verificationStatus: VerificationStatus.OFFICIALLY_VERIFIED,
        publicationStatus: PublicationStatus.PUBLISHED,
        lastCheckedAt: new Date(),
      },
    });

    return {
      message: 'Opportunity approved and published officially',
      opportunity: updatedOpp,
    };
  }

  async reject(id: string, notes?: string) {
    const item = await this.prisma.reviewQueueItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Review queue item ${id} not found`);
    }

    await this.prisma.reviewQueueItem.update({
      where: { id },
      data: {
        status: ReviewStatus.REJECTED,
        reviewerNotes: notes,
        resolvedAt: new Date(),
      },
    });

    const updatedOpp = await this.prisma.opportunity.update({
      where: { id: item.opportunityId },
      data: {
        verificationStatus: VerificationStatus.UNABLE_TO_VERIFY,
        publicationStatus: PublicationStatus.REJECTED,
      },
    });

    return {
      message: 'Opportunity rejected',
      opportunity: updatedOpp,
    };
  }
}
