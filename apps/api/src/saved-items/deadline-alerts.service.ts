import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AlertDispatchResult {
  userId: string;
  targetType: string;
  targetId: string;
  alertKey: string;
  status: 'SENT' | 'SKIPPED_DUPLICATE' | 'SUPPRESSED_UNSUBSCRIBED';
  message: string;
}

@Injectable()
export class DeadlineAlertsService {
  private readonly logger = new Logger(DeadlineAlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scans saved opportunities and tracked applications to generate deduplicated alerts
   * for approaching deadlines.
   */
  async processDeadlineAlerts(): Promise<AlertDispatchResult[]> {
    const results: AlertDispatchResult[] = [];
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // 1. Fetch saved opportunities with deadlines in the next 7 days
    const savedOpportunities = await this.prisma.savedOpportunity.findMany({
      where: {
        opportunity: {
          applicationDeadline: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
      },
      include: {
        opportunity: true,
        user: {
          include: {
            preferences: true,
          },
        },
      },
    });

    for (const saved of savedOpportunities) {
      const { user, opportunity } = saved;
      const deadline = opportunity.applicationDeadline!;
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const deadlineDateStr = deadline.toISOString().slice(0, 10);

      // Check user preferences
      const prefs = user.preferences;
      if (prefs && (!prefs.emailAlertsEnabled || prefs.unsubscribedAt)) {
        results.push({
          userId: user.id,
          targetType: 'OPPORTUNITY_DEADLINE',
          targetId: opportunity.id,
          alertKey: `opp-deadline-${opportunity.id}-${diffDays}d-${deadlineDateStr}`,
          status: 'SUPPRESSED_UNSUBSCRIBED',
          message: `Alert suppressed because user ${user.id} has disabled alerts or unsubscribed`,
        });
        continue;
      }

      // Generate deduplication key for this milestone alert
      const alertWindow = diffDays <= 2 ? '48h' : '7d';
      const alertKey = `opp-deadline-${opportunity.id}-${alertWindow}-${deadlineDateStr}`;

      // Check if alert was already dispatched to this user
      const existingAlert = await this.prisma.userAlertNotification.findUnique({
        where: {
          userId_alertKey: {
            userId: user.id,
            alertKey,
          },
        },
      });

      if (existingAlert) {
        results.push({
          userId: user.id,
          targetType: 'OPPORTUNITY_DEADLINE',
          targetId: opportunity.id,
          alertKey,
          status: 'SKIPPED_DUPLICATE',
          message: `Alert already sent for key ${alertKey}`,
        });
        continue;
      }

      // Record dispatch
      await this.prisma.userAlertNotification.create({
        data: {
          userId: user.id,
          targetType: 'OPPORTUNITY_DEADLINE',
          targetId: opportunity.id,
          alertKey,
          status: 'SENT',
        },
      });

      this.logger.log(`[ALERT DISPATCHED] Deadline approaching for "${opportunity.title}" (${alertWindow} left) to user ${user.email}`);

      results.push({
        userId: user.id,
        targetType: 'OPPORTUNITY_DEADLINE',
        targetId: opportunity.id,
        alertKey,
        status: 'SENT',
        message: `Alert dispatched for "${opportunity.title}" with deadline ${deadlineDateStr}`,
      });
    }

    // 2. Fetch tracked applications with follow-up dates due today or past
    const trackedFollowUps = await this.prisma.applicationTracking.findMany({
      where: {
        followUpDate: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        opportunity: true,
        user: {
          include: {
            preferences: true,
          },
        },
      },
    });

    for (const tracking of trackedFollowUps) {
      const { user, opportunity } = tracking;
      const followUpDateStr = tracking.followUpDate!.toISOString().slice(0, 10);
      const alertKey = `app-followup-${tracking.id}-${followUpDateStr}`;

      const prefs = user.preferences;
      if (prefs && (!prefs.emailAlertsEnabled || prefs.unsubscribedAt)) {
        continue;
      }

      const existingAlert = await this.prisma.userAlertNotification.findUnique({
        where: {
          userId_alertKey: {
            userId: user.id,
            alertKey,
          },
        },
      });

      if (!existingAlert) {
        await this.prisma.userAlertNotification.create({
          data: {
            userId: user.id,
            targetType: 'APPLICATION_FOLLOWUP',
            targetId: tracking.id,
            alertKey,
            status: 'SENT',
          },
        });

        results.push({
          userId: user.id,
          targetType: 'APPLICATION_FOLLOWUP',
          targetId: tracking.id,
          alertKey,
          status: 'SENT',
          message: `Follow-up alert dispatched for application to "${opportunity.title}"`,
        });
      }
    }

    return results;
  }
}
