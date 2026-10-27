import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOpportunityDto } from './dto/save-opportunity.dto';
import { SavePerkDto } from './dto/save-perk.dto';
import {
  CreateApplicationTrackingDto,
  UpdateApplicationTrackingDto,
} from './dto/application-tracking.dto';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';
import { ApplicationStatus } from '@startup-radar/shared-types';

@Injectable()
export class SavedItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. Saved Opportunities
  // -------------------------------------------------------------
  async getSavedOpportunities(userId: string) {
    return this.prisma.savedOpportunity.findMany({
      where: { userId },
      include: {
        opportunity: {
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            organizer: true,
            category: true,
            governmentLevel: true,
            departmentName: true,
            countryCode: true,
            stateCode: true,
            city: true,
            deliveryMode: true,
            benefitType: true,
            benefitAmountMin: true,
            benefitAmountMax: true,
            currency: true,
            applicationDeadline: true,
            officialApplicationUrl: true,
            verificationStatus: true,
            publicationStatus: true,
            startupStages: true,
            industries: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveOpportunity(userId: string, dto: SaveOpportunityDto) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id: dto.opportunityId },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity ${dto.opportunityId} not found`);
    }

    return this.prisma.savedOpportunity.upsert({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId: dto.opportunityId,
        },
      },
      create: {
        userId,
        opportunityId: dto.opportunityId,
        notes: dto.notes,
      },
      update: {
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        opportunity: true,
      },
    });
  }

  async unsaveOpportunity(userId: string, opportunityId: string) {
    const existing = await this.prisma.savedOpportunity.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Saved opportunity not found');
    }

    await this.prisma.savedOpportunity.delete({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });

    return { success: true, message: 'Opportunity removed from saved items' };
  }

  // -------------------------------------------------------------
  // 2. Saved Perks
  // -------------------------------------------------------------
  async getSavedPerks(userId: string) {
    return this.prisma.savedPerk.findMany({
      where: { userId },
      include: {
        perkProgram: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                providerType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async savePerk(userId: string, dto: SavePerkDto) {
    const perk = await this.prisma.startupPerkProgram.findUnique({
      where: { id: dto.perkProgramId },
    });

    if (!perk) {
      throw new NotFoundException(`Perk program ${dto.perkProgramId} not found`);
    }

    return this.prisma.savedPerk.upsert({
      where: {
        userId_perkProgramId: {
          userId,
          perkProgramId: dto.perkProgramId,
        },
      },
      create: {
        userId,
        perkProgramId: dto.perkProgramId,
        notes: dto.notes,
      },
      update: {
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        perkProgram: {
          include: {
            provider: true,
          },
        },
      },
    });
  }

  async unsavePerk(userId: string, perkProgramId: string) {
    const existing = await this.prisma.savedPerk.findUnique({
      where: {
        userId_perkProgramId: {
          userId,
          perkProgramId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Saved perk program not found');
    }

    await this.prisma.savedPerk.delete({
      where: {
        userId_perkProgramId: {
          userId,
          perkProgramId,
        },
      },
    });

    return { success: true, message: 'Perk program removed from saved items' };
  }

  // -------------------------------------------------------------
  // 3. Private Application Tracking
  // -------------------------------------------------------------
  async getTrackedApplications(userId: string) {
    return this.prisma.applicationTracking.findMany({
      where: { userId },
      include: {
        opportunity: {
          select: {
            id: true,
            slug: true,
            title: true,
            organizer: true,
            category: true,
            applicationDeadline: true,
            officialApplicationUrl: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createTrackedApplication(userId: string, dto: CreateApplicationTrackingDto) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id: dto.opportunityId },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity ${dto.opportunityId} not found`);
    }

    return this.prisma.applicationTracking.upsert({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId: dto.opportunityId,
        },
      },
      create: {
        userId,
        opportunityId: dto.opportunityId,
        status: (dto.status as any) || ApplicationStatus.APPLIED,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : new Date(),
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        privateNotes: dto.privateNotes,
      },
      update: {
        status: (dto.status as any) || undefined,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
        followUpDate: dto.followUpDate !== undefined ? (dto.followUpDate ? new Date(dto.followUpDate) : null) : undefined,
        privateNotes: dto.privateNotes !== undefined ? dto.privateNotes : undefined,
      },
      include: {
        opportunity: true,
      },
    });
  }

  async updateTrackedApplication(userId: string, id: string, dto: UpdateApplicationTrackingDto) {
    const tracking = await this.prisma.applicationTracking.findUnique({
      where: { id },
    });

    if (!tracking) {
      throw new NotFoundException(`Application tracking record ${id} not found`);
    }

    if (tracking.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application record');
    }

    return this.prisma.applicationTracking.update({
      where: { id },
      data: {
        status: (dto.status as any) || undefined,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
        followUpDate: dto.followUpDate !== undefined ? (dto.followUpDate ? new Date(dto.followUpDate) : null) : undefined,
        privateNotes: dto.privateNotes !== undefined ? dto.privateNotes : undefined,
      },
      include: {
        opportunity: true,
      },
    });
  }

  async deleteTrackedApplication(userId: string, id: string) {
    const tracking = await this.prisma.applicationTracking.findUnique({
      where: { id },
    });

    if (!tracking) {
      throw new NotFoundException(`Application tracking record ${id} not found`);
    }

    if (tracking.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application record');
    }

    await this.prisma.applicationTracking.delete({
      where: { id },
    });

    return { success: true, message: 'Application tracking record removed' };
  }

  // -------------------------------------------------------------
  // 4. User Preferences & Alerts Configuration
  // -------------------------------------------------------------
  async getUserPreferences(userId: string) {
    let prefs = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.userPreference.create({
        data: {
          userId,
          emailAlertsEnabled: true,
          alertFrequency: 'DAILY',
          deadlineAlertDays: [7, 2],
          notifyStatusChanges: true,
          notifyNewOpportunities: true,
          notifyPerkExpirations: true,
          interestedCategories: [],
          interestedIndustries: [],
        },
      });
    }

    return prefs;
  }

  async updateUserPreferences(userId: string, dto: UpdateUserPreferencesDto) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailAlertsEnabled: dto.emailAlertsEnabled ?? true,
        alertFrequency: (dto.alertFrequency as any) || 'DAILY',
        deadlineAlertDays: dto.deadlineAlertDays || [7, 2],
        notifyStatusChanges: dto.notifyStatusChanges ?? true,
        notifyNewOpportunities: dto.notifyNewOpportunities ?? true,
        notifyPerkExpirations: dto.notifyPerkExpirations ?? true,
        interestedCategories: (dto.interestedCategories as any) || [],
        interestedIndustries: (dto.interestedIndustries as any) || [],
        unsubscribedAt: dto.isUnsubscribed ? new Date() : null,
      },
      update: {
        emailAlertsEnabled: dto.emailAlertsEnabled !== undefined ? dto.emailAlertsEnabled : undefined,
        alertFrequency: (dto.alertFrequency as any) || undefined,
        deadlineAlertDays: dto.deadlineAlertDays || undefined,
        notifyStatusChanges: dto.notifyStatusChanges !== undefined ? dto.notifyStatusChanges : undefined,
        notifyNewOpportunities: dto.notifyNewOpportunities !== undefined ? dto.notifyNewOpportunities : undefined,
        notifyPerkExpirations: dto.notifyPerkExpirations !== undefined ? dto.notifyPerkExpirations : undefined,
        interestedCategories: (dto.interestedCategories as any) || undefined,
        interestedIndustries: (dto.interestedIndustries as any) || undefined,
        unsubscribedAt: dto.isUnsubscribed !== undefined ? (dto.isUnsubscribed ? new Date() : null) : undefined,
      },
    });
  }

  // -------------------------------------------------------------
  // 5. Account Deletion & GDPR Privacy
  // -------------------------------------------------------------
  async deleteUserAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Set audit logs userId to null before cascading delete if necessary
    await this.prisma.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // Delete user cascades to profile, startupProfile, preferences, savedItems, applications
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'Account and associated personal data deleted successfully',
    };
  }
}
