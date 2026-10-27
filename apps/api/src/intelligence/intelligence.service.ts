import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitFeedbackDto } from './dto/feedback.dto';
import {
  EligibilityAssessment,
  RecommendationFeedback,
  RecommendationTargetType,
  StartupNeed,
} from '@startup-radar/shared-types';

@Injectable()
export class IntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministic profile-to-opportunity and profile-to-perk recommendation generator.
   * Evaluates industry sectors, startup stages, declared needs, and eligibility criteria.
   */
  async generateRecommendations(userId: string) {
    const startup = await this.prisma.startupProfile.findUnique({
      where: { userId },
      include: {
        secondaryIndustries: true,
        needs: true,
      },
    });

    if (!startup) {
      throw new BadRequestException(
        'Please complete your startup profile before generating recommendations',
      );
    }

    const myPrimarySector = startup.primaryIndustry;
    const mySecondarySectors = startup.secondaryIndustries.map((si) => si.industry);
    const myAllSectors = [myPrimarySector, ...mySecondarySectors];
    const myStage = startup.stage;
    const myNeeds = startup.needs.map((n) => n.need);

    // 1. Fetch published opportunities
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
      },
      include: {
        eligibilityCriteria: true,
      },
    });

    // 2. Fetch active perk programs
    const perks = await this.prisma.startupPerkProgram.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        status: 'ACTIVE',
      },
      include: {
        provider: true,
        eligibilityCriteria: true,
      },
    });

    // Create a recommendation run record
    const run = await this.prisma.recommendationRun.create({
      data: {
        userId,
        algorithmVersion: 'v1.0-deterministic',
        opportunitiesEvaluated: opportunities.length,
        perksEvaluated: perks.length,
      },
    });

    const recommendationsToUpsert: any[] = [];

    // --- EVALUATE OPPORTUNITIES ---
    for (const opp of opportunities) {
      let score = 20; // baseline score
      const reasonCodes: string[] = [];
      const rationaleParts: string[] = [];
      const missingData: string[] = [];
      let assessment: EligibilityAssessment = EligibilityAssessment.LIKELY_MATCH;
      let suggestedNextStep = `Review official guidelines on ${opp.organizer || 'official portal'} and prepare pitch deck.`;

      // Sector Match (+30 for primary, +20 for secondary)
      const oppIndustries = opp.industries || [];
      if (oppIndustries.includes(myPrimarySector)) {
        score += 30;
        reasonCodes.push('PRIMARY_SECTOR_MATCH');
        rationaleParts.push(`Directly targets your primary industry: ${myPrimarySector.replace(/_/g, ' ')}`);
      } else if (oppIndustries.some((ind) => mySecondarySectors.includes(ind as any))) {
        score += 20;
        reasonCodes.push('SECONDARY_SECTOR_MATCH');
        rationaleParts.push('Aligned with your secondary industry focus');
      }

      // Stage Match (+25)
      const oppStages = opp.startupStages || [];
      if (oppStages.includes(myStage)) {
        score += 25;
        reasonCodes.push('STAGE_MATCH');
        rationaleParts.push(`Open to startups at the ${myStage.replace(/_/g, ' ')} stage`);
      }

      // Need Match (+20)
      if (
        (opp.category === 'GRANT_FUNDING' || opp.benefitType === 'GRANT') &&
        (myNeeds.includes(StartupNeed.GRANTS) || myNeeds.includes(StartupNeed.FUNDING))
      ) {
        score += 20;
        reasonCodes.push('NEED_MATCH_GRANT');
        rationaleParts.push('Matches your explicit funding and grant needs');
      } else if (
        opp.category === 'INCUBATOR_ACCELERATOR' &&
        myNeeds.includes(StartupNeed.INCUBATION)
      ) {
        score += 20;
        reasonCodes.push('NEED_MATCH_INCUBATION');
        rationaleParts.push('Matches your incubation requirement');
      }

      // Eligibility Assessment & Missing Information Checks
      if (opp.category === 'GOVERNMENT_SCHEME' || opp.organizer?.toLowerCase().includes('dpiit')) {
        if (!startup.dpiitRecognized) {
          assessment = EligibilityAssessment.NEEDS_INFORMATION;
          missingData.push('DPIIT Startup Recognition');
          suggestedNextStep = 'Apply for DPIIT Recognition Certificate via startupindia.gov.in before applying.';
          rationaleParts.push('Requires official DPIIT recognition certificate');
        }
      }

      if (opp.eligibilitySummary?.toLowerCase().includes('msme') && !startup.msmeRegistered) {
        if (assessment === EligibilityAssessment.LIKELY_MATCH) {
          assessment = EligibilityAssessment.POTENTIAL_ISSUE;
        }
        missingData.push('MSME Udyam Registration');
        suggestedNextStep = 'Register your enterprise on the Udyam portal to become eligible.';
      }

      if (opp.eligibilitySummary?.toLowerCase().includes('registered') && !startup.isRegisteredCompany) {
        assessment = EligibilityAssessment.POTENTIAL_ISSUE;
        missingData.push('Incorporation Certificate (Pvt Ltd / LLP)');
        suggestedNextStep = 'Incorporate as Private Limited or LLP to meet formal registration prerequisites.';
      }

      const finalScore = Math.min(100, score);
      if (finalScore >= 35) {
        recommendationsToUpsert.push({
          runId: run.id,
          userId,
          targetType: RecommendationTargetType.OPPORTUNITY,
          targetId: opp.id,
          opportunityId: opp.id,
          relevanceScore: finalScore,
          assessment,
          reasonCodes,
          rationale: rationaleParts.join('. ') || 'Opportunity aligns with your geographic and stage profile.',
          missingData,
          suggestedNextStep,
          algorithmVersion: 'v1.0-deterministic',
        });
      }
    }

    // --- EVALUATE PERKS & CREDITS ---
    for (const perk of perks) {
      let score = 25;
      const reasonCodes: string[] = [];
      const rationaleParts: string[] = [];
      const missingData: string[] = [];
      let assessment: EligibilityAssessment = EligibilityAssessment.LIKELY_MATCH;
      let suggestedNextStep = `Review ${perk.provider.name} terms and submit application via official startup portal.`;

      // Need Match (+35)
      if (
        perk.benefitType === 'CLOUD_CREDITS' &&
        (myNeeds.includes(StartupNeed.CLOUD_CREDITS) || myNeeds.includes(StartupNeed.SOFTWARE_TOOLS))
      ) {
        score += 35;
        reasonCodes.push('NEED_MATCH_CLOUD_CREDITS');
        rationaleParts.push(`Directly satisfies your need for cloud infrastructure credits ($${perk.statedValueAmount?.toLocaleString()} value)`);
      } else if (
        perk.benefitType === 'DEVELOPER_TOOL' &&
        myNeeds.includes(StartupNeed.SOFTWARE_TOOLS)
      ) {
        score += 30;
        reasonCodes.push('NEED_MATCH_DEV_TOOLS');
        rationaleParts.push('Provides developer tooling to accelerate software build cycles');
      }

      // Stage Eligibility
      const eligibleStages = perk.eligibleStages || [];
      if (eligibleStages.length === 0 || eligibleStages.includes(myStage)) {
        score += 25;
        reasonCodes.push('STAGE_MATCH');
        rationaleParts.push(`Eligible for ${myStage.replace(/_/g, ' ')} startups`);
      }

      // Country Eligibility
      if (perk.eligibleCountries.includes(startup.countryCode)) {
        score += 15;
      }

      // Check Criteria
      for (const crit of perk.eligibilityCriteria) {
        if (crit.description.toLowerCase().includes('funded') && myStage === 'EXPLORING_IDEA') {
          assessment = EligibilityAssessment.POTENTIAL_ISSUE;
          missingData.push('Institutional VC / Incubator Partner Affiliation');
          suggestedNextStep = 'Apply to Activate Founders tier instead of Portfolio tier, or partner with an approved accelerator.';
        }
      }

      const finalScore = Math.min(100, score);
      if (finalScore >= 35) {
        recommendationsToUpsert.push({
          runId: run.id,
          userId,
          targetType: RecommendationTargetType.PERK,
          targetId: perk.id,
          perkProgramId: perk.id,
          relevanceScore: finalScore,
          assessment,
          reasonCodes,
          rationale: rationaleParts.join('. ') || 'Perk package matches your technical infrastructure requirements.',
          missingData,
          suggestedNextStep,
          algorithmVersion: 'v1.0-deterministic',
        });
      }
    }

    // Upsert recommendations in DB
    for (const rec of recommendationsToUpsert) {
      await this.prisma.recommendation.upsert({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: rec.targetType,
            targetId: rec.targetId,
          },
        },
        create: rec,
        update: {
          runId: rec.runId,
          relevanceScore: rec.relevanceScore,
          assessment: rec.assessment,
          reasonCodes: rec.reasonCodes,
          rationale: rec.rationale,
          missingData: rec.missingData,
          suggestedNextStep: rec.suggestedNextStep,
        },
      });
    }

    // Update run summary
    await this.prisma.recommendationRun.update({
      where: { id: run.id },
      data: {
        recommendationsCount: recommendationsToUpsert.length,
      },
    });

    return this.getRecommendations(userId);
  }

  // -------------------------------------------------------------
  // Retrieve Recommendations with Canonical References
  // -------------------------------------------------------------
  async getRecommendations(
    userId: string,
    filter?: { targetType?: RecommendationTargetType; assessment?: EligibilityAssessment },
  ) {
    const where: any = {
      userId,
      isDismissed: false,
    };

    if (filter?.targetType) where.targetType = filter.targetType;
    if (filter?.assessment) where.assessment = filter.assessment;

    const list = await this.prisma.recommendation.findMany({
      where,
      include: {
        opportunity: true,
        perkProgram: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { relevanceScore: 'desc' },
    });

    return list.map((item) => {
      let targetTitle = '';
      let targetCategory: string | undefined;
      let officialSourceUrl: string | undefined;
      let benefitHighlight: string | undefined;

      if (item.targetType === 'OPPORTUNITY' && item.opportunity) {
        targetTitle = item.opportunity.title;
        targetCategory = item.opportunity.category;
        officialSourceUrl = item.opportunity.officialApplicationUrl || item.opportunity.officialNotificationUrl || undefined;
        if (item.opportunity.benefitAmountMin) {
          benefitHighlight = `₹${item.opportunity.benefitAmountMin.toLocaleString()} - ₹${item.opportunity.benefitAmountMax?.toLocaleString()} ${item.opportunity.currency}`;
        }
      } else if (item.targetType === 'PERK' && item.perkProgram) {
        targetTitle = item.perkProgram.programName;
        targetCategory = item.perkProgram.benefitType;
        officialSourceUrl = item.perkProgram.officialProgramUrl;
        if (item.perkProgram.statedValueAmount) {
          benefitHighlight = `$${item.perkProgram.statedValueAmount.toLocaleString()} ${item.perkProgram.currency}`;
        }
      }

      return {
        ...item,
        targetTitle,
        targetCategory,
        officialSourceUrl,
        benefitHighlight,
      };
    });
  }

  // -------------------------------------------------------------
  // Summary & Action Next-Steps Overview
  // -------------------------------------------------------------
  async getIntelligenceSummary(userId: string) {
    const recommendations = await this.getRecommendations(userId);
    const startup = await this.prisma.startupProfile.findUnique({
      where: { userId },
      include: { needs: true },
    });

    const likelyMatchesCount = recommendations.filter(
      (r) => r.assessment === EligibilityAssessment.LIKELY_MATCH,
    ).length;
    const potentialIssuesCount = recommendations.filter(
      (r) => r.assessment === EligibilityAssessment.POTENTIAL_ISSUE,
    ).length;
    const needsInfoCount = recommendations.filter(
      (r) => r.assessment === EligibilityAssessment.NEEDS_INFORMATION,
    ).length;

    // Collect distinct top next-step actions
    const topNextSteps: string[] = [];
    for (const r of recommendations) {
      if (r.suggestedNextStep && !topNextSteps.includes(r.suggestedNextStep)) {
        topNextSteps.push(r.suggestedNextStep);
      }
      if (topNextSteps.length >= 4) break;
    }

    // Check missing profile fields
    const missingProfileFields: string[] = [];
    if (!startup?.dpiitRecognized) missingProfileFields.push('DPIIT Startup Recognition');
    if (!startup?.msmeRegistered) missingProfileFields.push('MSME Udyam Registration');
    if (!startup?.isRegisteredCompany) missingProfileFields.push('Company Incorporation Certificate');
    if (!startup?.needs || startup.needs.length === 0) missingProfileFields.push('Startup Needs Preferences');

    return {
      recommendations,
      totalCount: recommendations.length,
      likelyMatchesCount,
      potentialIssuesCount,
      needsInfoCount,
      topNextSteps,
      missingProfileFields,
    };
  }

  // -------------------------------------------------------------
  // Feedback & Dismissal Controls
  // -------------------------------------------------------------
  async submitFeedback(userId: string, recommendationId: string, dto: SubmitFeedbackDto) {
    const rec = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!rec) throw new NotFoundException('Recommendation not found');
    if (rec.userId !== userId) throw new ForbiddenException('Not authorized');

    await this.prisma.recommendationFeedbackRecord.create({
      data: {
        userId,
        recommendationId,
        feedback: dto.feedback as any,
        comments: dto.comments,
      },
    });

    return this.prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        feedback: dto.feedback as any,
        isDismissed: dto.feedback === RecommendationFeedback.DISMISSED ? true : rec.isDismissed,
      },
    });
  }

  async dismissRecommendation(userId: string, recommendationId: string) {
    const rec = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!rec) throw new NotFoundException('Recommendation not found');
    if (rec.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.recommendation.update({
      where: { id: recommendationId },
      data: { isDismissed: true },
    });
  }
}
