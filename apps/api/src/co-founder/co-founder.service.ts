import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFounderProfileDto } from './dto/create-founder-profile.dto';
import { SearchFoundersDto } from './dto/search-founders.dto';
import {
  RespondConnectionRequestDto,
  SendConnectionRequestDto,
} from './dto/connection-request.dto';
import { BlockUserDto, ReportProfileDto } from './dto/moderation.dto';
import {
  ConnectionRequestStatus,
  FounderProfileStatus,
  SkillType,
} from '@startup-radar/shared-types';

@Injectable()
export class CoFounderService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. Founder Profile Management
  // -------------------------------------------------------------
  async createOrUpdateProfile(userId: string, dto: CreateFounderProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.founderProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: dto.displayName,
        headline: dto.headline,
        bio: dto.bio,
        currentRole: dto.currentRole,
        desiredRole: dto.desiredRole,
        stage: (dto.stage as any) || 'EXPLORING_IDEA',
        primarySector: (dto.primarySector as any) || 'SOFTWARE_IT',
        locationCity: dto.locationCity,
        locationState: dto.locationState,
        countryCode: dto.countryCode || 'IN',
        commitment: (dto.commitment as any) || 'FULL_TIME',
        workLocation: (dto.workLocation as any) || 'HYBRID',
        status: (dto.status as any) || 'ACTIVE',
        contactEmail: dto.contactEmail || user.email,
        contactPhone: dto.contactPhone,
        linkedinUrl: dto.linkedinUrl,
        githubUrl: dto.githubUrl,
      },
      update: {
        displayName: dto.displayName,
        headline: dto.headline !== undefined ? dto.headline : undefined,
        bio: dto.bio !== undefined ? dto.bio : undefined,
        currentRole: dto.currentRole !== undefined ? dto.currentRole : undefined,
        desiredRole: dto.desiredRole !== undefined ? dto.desiredRole : undefined,
        stage: (dto.stage as any) || undefined,
        primarySector: (dto.primarySector as any) || undefined,
        locationCity: dto.locationCity !== undefined ? dto.locationCity : undefined,
        locationState: dto.locationState !== undefined ? dto.locationState : undefined,
        countryCode: dto.countryCode || undefined,
        commitment: (dto.commitment as any) || undefined,
        workLocation: (dto.workLocation as any) || undefined,
        status: (dto.status as any) || undefined,
        contactEmail: dto.contactEmail !== undefined ? dto.contactEmail : undefined,
        contactPhone: dto.contactPhone !== undefined ? dto.contactPhone : undefined,
        linkedinUrl: dto.linkedinUrl !== undefined ? dto.linkedinUrl : undefined,
        githubUrl: dto.githubUrl !== undefined ? dto.githubUrl : undefined,
      },
    });

    // Update skills if provided
    if (dto.skills) {
      await this.prisma.founderSkill.deleteMany({ where: { profileId: profile.id } });
      if (dto.skills.length > 0) {
        await this.prisma.founderSkill.createMany({
          data: dto.skills.map((s) => ({
            profileId: profile.id,
            skillName: s.skillName,
            skillType: (s.skillType as any) || 'OFFERED',
            proficiency: (s.proficiency as any) || 'INTERMEDIATE',
          })),
        });
      }
    }

    // Update interests if provided
    if (dto.interests) {
      await this.prisma.founderInterest.deleteMany({ where: { profileId: profile.id } });
      if (dto.interests.length > 0) {
        await this.prisma.founderInterest.createMany({
          data: dto.interests.map((i) => ({
            profileId: profile.id,
            sector: i.sector as any,
            priority: i.priority || 1,
          })),
        });
      }
    }

    return this.getProfileById(profile.id, true);
  }

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        interests: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Founder profile not found. Please create your profile.');
    }

    return profile;
  }

  async getProfileById(profileId: string, includePrivateContact = false) {
    const profile = await this.prisma.founderProfile.findUnique({
      where: { id: profileId },
      include: {
        skills: true,
        interests: true,
      },
    });

    if (!profile) throw new NotFoundException('Founder profile not found');

    if (!includePrivateContact) {
      const { contactEmail, contactPhone, ...publicProfile } = profile;
      return publicProfile;
    }

    return profile;
  }

  // -------------------------------------------------------------
  // 2. Discover & Search Profiles with Privacy & Blocking Filter
  // -------------------------------------------------------------
  async searchFounders(viewerUserId: string | null, dto: SearchFoundersDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Collect blocked user IDs
    let excludedUserIds: string[] = [];
    if (viewerUserId) {
      const blockedRecords = await this.prisma.blockedUser.findMany({
        where: {
          OR: [{ blockerId: viewerUserId }, { blockedUserId: viewerUserId }],
        },
      });
      excludedUserIds = blockedRecords.map((b) =>
        b.blockerId === viewerUserId ? b.blockedUserId : b.blockerId,
      );
      excludedUserIds.push(viewerUserId); // Don't show own profile in search
    }

    const where: any = {
      status: 'ACTIVE',
      userId: { notIn: excludedUserIds },
    };

    if (dto.sector) where.primarySector = dto.sector;
    if (dto.stage) where.stage = dto.stage;
    if (dto.commitment) where.commitment = dto.commitment;
    if (dto.workLocation) where.workLocation = dto.workLocation;
    if (dto.city) where.locationCity = { contains: dto.city, mode: 'insensitive' };

    if (dto.q) {
      where.OR = [
        { displayName: { contains: dto.q, mode: 'insensitive' } },
        { headline: { contains: dto.q, mode: 'insensitive' } },
        { bio: { contains: dto.q, mode: 'insensitive' } },
        { currentRole: { contains: dto.q, mode: 'insensitive' } },
        { desiredRole: { contains: dto.q, mode: 'insensitive' } },
        { skills: { some: { skillName: { contains: dto.q, mode: 'insensitive' } } } },
      ];
    }

    if (dto.seekingSkill) {
      where.skills = {
        some: {
          skillName: { contains: dto.seekingSkill, mode: 'insensitive' },
          skillType: 'OFFERED',
        },
      };
    }

    const [total, profiles] = await Promise.all([
      this.prisma.founderProfile.count({ where }),
      this.prisma.founderProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          skills: true,
          interests: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Strip private contact info for public discovery
    const sanitizedProfiles = profiles.map((p) => {
      const { contactEmail, contactPhone, ...publicFields } = p;
      return publicFields;
    });

    return {
      data: sanitizedProfiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // -------------------------------------------------------------
  // 3. Mutual Consent Connection Requests
  // -------------------------------------------------------------
  async sendConnectionRequest(requesterUserId: string, dto: SendConnectionRequestDto) {
    const requesterProfile = await this.prisma.founderProfile.findUnique({
      where: { userId: requesterUserId },
    });
    if (!requesterProfile) {
      throw new BadRequestException('You must create a founder profile before connecting with others');
    }

    if (requesterProfile.id === dto.recipientProfileId) {
      throw new BadRequestException('You cannot send a connection request to yourself');
    }

    const recipientProfile = await this.prisma.founderProfile.findUnique({
      where: { id: dto.recipientProfileId },
    });
    if (!recipientProfile || recipientProfile.status !== 'ACTIVE') {
      throw new NotFoundException('Recipient profile not found or is currently inactive');
    }

    // Check if blocked
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: requesterUserId, blockedUserId: recipientProfile.userId },
          { blockerId: recipientProfile.userId, blockedUserId: requesterUserId },
        ],
      },
    });
    if (isBlocked) {
      throw new ForbiddenException('Cannot send request to this profile');
    }

    // Check if prior request exists
    const existing = await this.prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { requesterId: requesterProfile.id, recipientId: recipientProfile.id },
          { requesterId: recipientProfile.id, recipientId: requesterProfile.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new BadRequestException('A pending connection request already exists between these profiles');
      }
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('You are already connected with this founder');
      }
    }

    return this.prisma.connectionRequest.create({
      data: {
        requesterId: requesterProfile.id,
        recipientId: recipientProfile.id,
        introduction: dto.introduction,
        status: 'PENDING',
      },
      include: {
        recipient: {
          select: {
            id: true,
            displayName: true,
            headline: true,
            primarySector: true,
            commitment: true,
          },
        },
      },
    });
  }

  async getConnectionRequests(userId: string, filter: 'all' | 'sent' | 'received' = 'all') {
    const profile = await this.prisma.founderProfile.findUnique({ where: { userId } });
    if (!profile) return [];

    const where: any = {};
    if (filter === 'sent') where.requesterId = profile.id;
    else if (filter === 'received') where.recipientId = profile.id;
    else {
      where.OR = [{ requesterId: profile.id }, { recipientId: profile.id }];
    }

    const requests = await this.prisma.connectionRequest.findMany({
      where,
      include: {
        requester: {
          include: { skills: true, interests: true },
        },
        recipient: {
          include: { skills: true, interests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip private contact info unless request status is ACCEPTED
    return requests.map((req) => {
      const isAccepted = req.status === 'ACCEPTED';
      const sanitizedRequester = isAccepted
        ? req.requester
        : (({ contactEmail, contactPhone, ...rest }) => rest)(req.requester as any);
      const sanitizedRecipient = isAccepted
        ? req.recipient
        : (({ contactEmail, contactPhone, ...rest }) => rest)(req.recipient as any);

      return {
        ...req,
        requester: sanitizedRequester,
        recipient: sanitizedRecipient,
      };
    });
  }

  async respondConnectionRequest(
    recipientUserId: string,
    requestId: string,
    dto: RespondConnectionRequestDto,
  ) {
    const profile = await this.prisma.founderProfile.findUnique({ where: { userId: recipientUserId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const request = await this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
      include: { requester: true, recipient: true },
    });

    if (!request) throw new NotFoundException('Connection request not found');

    if (request.recipientId !== profile.id) {
      throw new ForbiddenException('You are not authorized to respond to this request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Connection request is already ${request.status}`);
    }

    const isAccepting = dto.action === 'ACCEPT';

    return this.prisma.connectionRequest.update({
      where: { id: requestId },
      data: {
        status: isAccepting ? 'ACCEPTED' : 'DECLINED',
        contactExchanged: isAccepting,
        responseNote: dto.responseNote,
        respondedAt: new Date(),
      },
      include: {
        requester: true,
        recipient: true,
      },
    });
  }

  async withdrawConnectionRequest(requesterUserId: string, requestId: string) {
    const profile = await this.prisma.founderProfile.findUnique({ where: { userId: requesterUserId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const request = await this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Connection request not found');

    if (request.requesterId !== profile.id) {
      throw new ForbiddenException('You can only withdraw your own sent requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending connection requests can be withdrawn');
    }

    return this.prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: 'WITHDRAWN' },
    });
  }

  // -------------------------------------------------------------
  // 4. Moderation: Block & Report
  // -------------------------------------------------------------
  async blockUser(blockerUserId: string, targetUserId: string, dto: BlockUserDto) {
    if (blockerUserId === targetUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.prisma.blockedUser.upsert({
      where: {
        blockerId_blockedUserId: {
          blockerId: blockerUserId,
          blockedUserId: targetUserId,
        },
      },
      create: {
        blockerId: blockerUserId,
        blockedUserId: targetUserId,
        reason: dto.reason,
      },
      update: {
        reason: dto.reason,
      },
    });

    return { success: true, message: 'User blocked successfully' };
  }

  async reportProfile(reporterUserId: string, profileId: string, dto: ReportProfileDto) {
    const profile = await this.prisma.founderProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Founder profile not found');

    if (profile.userId === reporterUserId) {
      throw new BadRequestException('You cannot report your own profile');
    }

    return this.prisma.profileReport.create({
      data: {
        reporterId: reporterUserId,
        reportedProfileId: profile.id,
        category: dto.category,
        description: dto.description,
        status: 'PENDING',
      },
    });
  }

  // -------------------------------------------------------------
  // 5. Explainable Rules-Based Recommendation Engine
  // -------------------------------------------------------------
  async getRecommendations(userId: string) {
    const userProfile = await this.prisma.founderProfile.findUnique({
      where: { userId },
      include: { skills: true, interests: true },
    });

    if (!userProfile) {
      throw new BadRequestException('Complete your founder profile to receive tailored co-founder recommendations');
    }

    // Get candidate active profiles (excluding self and blocked users)
    const blockedRecords = await this.prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] },
    });
    const excludedUserIds = blockedRecords.map((b) =>
      b.blockerId === userId ? b.blockedUserId : b.blockerId,
    );
    excludedUserIds.push(userId);

    const candidates = await this.prisma.founderProfile.findMany({
      where: {
        status: 'ACTIVE',
        userId: { notIn: excludedUserIds },
      },
      include: { skills: true, interests: true },
    });

    const recommendations = candidates.map((candidate) => {
      let score = 0;
      const matchReasons: string[] = [];
      const complementarySkills: string[] = [];
      const sharedSectors: string[] = [];
      const synergies: string[] = [];

      // 1. Skill Complementarity Check (+35 max)
      // Check if user seeks what candidate offers
      const mySeekingSkills = userProfile.skills
        .filter((s) => s.skillType === SkillType.SEEKING)
        .map((s) => s.skillName.toLowerCase());
      const theirOfferedSkills = candidate.skills
        .filter((s) => s.skillType === SkillType.OFFERED)
        .map((s) => s.skillName.toLowerCase());

      const skillsTheyOfferISeek = theirOfferedSkills.filter((s) =>
        mySeekingSkills.some((my) => my.includes(s) || s.includes(my)),
      );

      // Check if candidate seeks what user offers
      const myOfferedSkills = userProfile.skills
        .filter((s) => s.skillType === SkillType.OFFERED)
        .map((s) => s.skillName.toLowerCase());
      const theirSeekingSkills = candidate.skills
        .filter((s) => s.skillType === SkillType.SEEKING)
        .map((s) => s.skillName.toLowerCase());

      const skillsIOfferTheySeek = myOfferedSkills.filter((s) =>
        theirSeekingSkills.some((their) => their.includes(s) || s.includes(their)),
      );

      if (skillsTheyOfferISeek.length > 0) {
        score += 25;
        complementarySkills.push(...skillsTheyOfferISeek);
        matchReasons.push(`Offers ${skillsTheyOfferISeek.join(', ')} which matches skills you are seeking.`);
      }

      if (skillsIOfferTheySeek.length > 0) {
        score += 15;
        matchReasons.push(`Seeking ${skillsIOfferTheySeek.join(', ')} which you offer.`);
      }

      // 2. Sector / Industry Alignment (+25 max)
      if (userProfile.primarySector === candidate.primarySector) {
        score += 20;
        sharedSectors.push(candidate.primarySector);
        matchReasons.push(`Both actively focused on ${candidate.primarySector.replace(/_/g, ' ')}.`);
      }

      const myInterestSectors = userProfile.interests.map((i) => i.sector);
      const theirInterestSectors = candidate.interests.map((i) => i.sector);
      const commonInterestSectors = myInterestSectors.filter((s) =>
        theirInterestSectors.includes(s),
      );

      if (commonInterestSectors.length > 0) {
        score += 10;
        sharedSectors.push(...commonInterestSectors);
        matchReasons.push(`Shared domain interest in ${commonInterestSectors.join(', ')}.`);
      }

      // 3. Commitment Synergy (+15 max)
      if (userProfile.commitment === candidate.commitment) {
        score += 15;
        synergies.push(`Mutual ${candidate.commitment} commitment`);
        matchReasons.push(`Both committed to ${candidate.commitment.replace(/_/g, ' ')} partnership.`);
      }

      // 4. Work Location Compatibility (+15 max)
      if (
        userProfile.workLocation === candidate.workLocation ||
        userProfile.workLocation === 'REMOTE' ||
        candidate.workLocation === 'REMOTE'
      ) {
        score += 15;
        synergies.push(`Compatible work style (${candidate.workLocation})`);
        matchReasons.push(`Compatible working style: ${candidate.workLocation}.`);
      }

      // 5. Stage Compatibility (+10 max)
      if (userProfile.stage === candidate.stage) {
        score += 10;
        matchReasons.push(`Both at the ${candidate.stage.replace(/_/g, ' ')} stage.`);
      }

      const finalScore = Math.min(100, Math.max(10, score));

      // Sanitize candidate public info
      const { contactEmail, contactPhone, ...sanitizedCandidate } = candidate;

      return {
        candidateProfile: sanitizedCandidate,
        matchScore: finalScore,
        matchReasons: matchReasons.length > 0 ? matchReasons : ['General founder compatibility based on stage and availability.'],
        complementarySkills,
        sharedSectors,
        synergies,
      };
    });

    // Sort by match score descending
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}
