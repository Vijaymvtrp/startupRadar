import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StartupProfileService } from './startup-profile.service';
import { CreateStartupProfileDto, UpdateNeedsDto } from './startup-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Startup Profile')
@Controller('startup-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StartupProfileController {
  constructor(private readonly startupProfileService: StartupProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user startup profile with industries and needs' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    const profile = await this.startupProfileService.getProfile(userId);
    return {
      profile: profile || null,
      hasProfile: !!profile,
    };
  }

  @Put('me')
  @ApiOperation({ summary: 'Create or update startup profile with multi-industry and stage preferences' })
  @ApiResponse({ status: 200, description: 'Profile created/updated successfully' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStartupProfileDto,
  ) {
    const profile = await this.startupProfileService.upsertProfile(userId, dto);
    return {
      message: 'Startup profile updated successfully',
      profile,
    };
  }

  @Get('me/needs')
  @ApiOperation({ summary: 'Get current startup needs selection' })
  async getNeeds(@CurrentUser('id') userId: string) {
    const profile = await this.startupProfileService.getProfile(userId);
    return {
      needs: profile?.needs || [],
    };
  }

  @Put('me/needs')
  @ApiOperation({ summary: 'Update startup needs selection' })
  async updateNeeds(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNeedsDto,
  ) {
    const profile = await this.startupProfileService.updateNeeds(userId, dto);
    return {
      message: 'Needs updated successfully',
      needs: profile?.needs || [],
    };
  }
}
