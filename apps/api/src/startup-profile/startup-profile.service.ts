import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStartupProfileDto, UpdateNeedsDto } from './startup-profile.dto';
import { BusinessModel, IndustrySector, StartupNeed, StartupStage } from '@prisma/client';

@Injectable()
export class StartupProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.startupProfile.findUnique({
      where: { userId },
      include: {
        secondaryIndustries: true,
        needs: true,
      },
    });

    if (!profile) {
      return null;
    }

    return this.formatProfile(profile);
  }

  async upsertProfile(userId: string, dto: CreateStartupProfileDto) {
    // 1. Upsert base profile
    const profile = await this.prisma.startupProfile.upsert({
      where: { userId },
      create: {
        userId,
        startupName: dto.startupName?.trim(),
        tagline: dto.tagline?.trim(),
        description: dto.description?.trim(),
        primaryIndustry: dto.primaryIndustry as unknown as IndustrySector,
        businessModel: (dto.businessModel || BusinessModel.B2B) as unknown as BusinessModel,
        stage: (dto.stage || StartupStage.EXPLORING_IDEA) as unknown as StartupStage,
        countryCode: dto.countryCode || 'IN',
        stateCode: dto.stateCode?.trim(),
        city: dto.city?.trim(),
        isRegisteredCompany: dto.isRegisteredCompany || false,
        dpiitRecognized: dto.dpiitRecognized || false,
        msmeRegistered: dto.msmeRegistered || false,
        teamSizeBand: dto.teamSizeBand?.trim(),
      },
      update: {
        startupName: dto.startupName?.trim(),
        tagline: dto.tagline?.trim(),
        description: dto.description?.trim(),
        primaryIndustry: dto.primaryIndustry as unknown as IndustrySector,
        businessModel: dto.businessModel as unknown as BusinessModel,
        stage: dto.stage as unknown as StartupStage,
        countryCode: dto.countryCode || 'IN',
        stateCode: dto.stateCode?.trim(),
        city: dto.city?.trim(),
        isRegisteredCompany: dto.isRegisteredCompany,
        dpiitRecognized: dto.dpiitRecognized,
        msmeRegistered: dto.msmeRegistered,
        teamSizeBand: dto.teamSizeBand?.trim(),
      },
    });

    // 2. Synchronize secondary industries if provided
    if (dto.secondaryIndustries !== undefined) {
      await this.prisma.startupProfileIndustry.deleteMany({
        where: { startupProfileId: profile.id },
      });

      if (dto.secondaryIndustries.length > 0) {
        await this.prisma.startupProfileIndustry.createMany({
          data: dto.secondaryIndustries.map((industry) => ({
            startupProfileId: profile.id,
            industry: industry as unknown as IndustrySector,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 3. Synchronize needs if provided
    if (dto.needs !== undefined) {
      await this.prisma.startupProfileNeed.deleteMany({
        where: { startupProfileId: profile.id },
      });

      if (dto.needs.length > 0) {
        await this.prisma.startupProfileNeed.createMany({
          data: dto.needs.map((need) => ({
            startupProfileId: profile.id,
            need: need as unknown as StartupNeed,
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.getProfile(userId);
  }

  async updateNeeds(userId: string, dto: UpdateNeedsDto) {
    const profile = await this.prisma.startupProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Startup profile not found. Please create a profile first.');
    }

    await this.prisma.startupProfileNeed.deleteMany({
      where: { startupProfileId: profile.id },
    });

    if (dto.needs.length > 0) {
      await this.prisma.startupProfileNeed.createMany({
        data: dto.needs.map((need) => ({
          startupProfileId: profile.id,
          need: need as unknown as StartupNeed,
        })),
        skipDuplicates: true,
      });
    }

    return this.getProfile(userId);
  }

  private formatProfile(profile: any) {
    return {
      id: profile.id,
      userId: profile.userId,
      startupName: profile.startupName,
      tagline: profile.tagline,
      description: profile.description,
      primaryIndustry: profile.primaryIndustry,
      secondaryIndustries: profile.secondaryIndustries?.map((item: any) => item.industry) || [],
      businessModel: profile.businessModel,
      stage: profile.stage,
      countryCode: profile.countryCode,
      stateCode: profile.stateCode,
      city: profile.city,
      isRegisteredCompany: profile.isRegisteredCompany,
      dpiitRecognized: profile.dpiitRecognized,
      msmeRegistered: profile.msmeRegistered,
      teamSizeBand: profile.teamSizeBand,
      needs: profile.needs?.map((item: any) => item.need) || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
