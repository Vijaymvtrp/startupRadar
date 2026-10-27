import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SavedItemsService } from './saved-items.service';
import { DeadlineAlertsService } from './deadline-alerts.service';
import { SaveOpportunityDto } from './dto/save-opportunity.dto';
import { SavePerkDto } from './dto/save-perk.dto';
import {
  CreateApplicationTrackingDto,
  UpdateApplicationTrackingDto,
} from './dto/application-tracking.dto';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';

@Controller()
export class SavedItemsController {
  constructor(
    private readonly savedItemsService: SavedItemsService,
    private readonly deadlineAlertsService: DeadlineAlertsService,
  ) {}

  // -------------------------------------------------------------
  // 1. Saved Opportunities
  // -------------------------------------------------------------
  @Get('me/saved-opportunities')
  @UseGuards(JwtAuthGuard)
  async getSavedOpportunities(@CurrentUser() user: any) {
    return this.savedItemsService.getSavedOpportunities(user.id);
  }

  @Post('me/saved-opportunities')
  @UseGuards(JwtAuthGuard)
  async saveOpportunity(
    @CurrentUser() user: any,
    @Body() dto: SaveOpportunityDto,
  ) {
    return this.savedItemsService.saveOpportunity(user.id, dto);
  }

  @Delete('me/saved-opportunities/:opportunityId')
  @UseGuards(JwtAuthGuard)
  async unsaveOpportunity(
    @CurrentUser() user: any,
    @Param('opportunityId') opportunityId: string,
  ) {
    return this.savedItemsService.unsaveOpportunity(user.id, opportunityId);
  }

  // -------------------------------------------------------------
  // 2. Saved Perks
  // -------------------------------------------------------------
  @Get('me/saved-perks')
  @UseGuards(JwtAuthGuard)
  async getSavedPerks(@CurrentUser() user: any) {
    return this.savedItemsService.getSavedPerks(user.id);
  }

  @Post('me/saved-perks')
  @UseGuards(JwtAuthGuard)
  async savePerk(
    @CurrentUser() user: any,
    @Body() dto: SavePerkDto,
  ) {
    return this.savedItemsService.savePerk(user.id, dto);
  }

  @Delete('me/saved-perks/:perkProgramId')
  @UseGuards(JwtAuthGuard)
  async unsavePerk(
    @CurrentUser() user: any,
    @Param('perkProgramId') perkProgramId: string,
  ) {
    return this.savedItemsService.unsavePerk(user.id, perkProgramId);
  }

  // -------------------------------------------------------------
  // 3. Private Application Tracking
  // -------------------------------------------------------------
  @Get('me/application-tracking')
  @UseGuards(JwtAuthGuard)
  async getTrackedApplications(@CurrentUser() user: any) {
    return this.savedItemsService.getTrackedApplications(user.id);
  }

  @Post('me/application-tracking')
  @UseGuards(JwtAuthGuard)
  async createTrackedApplication(
    @CurrentUser() user: any,
    @Body() dto: CreateApplicationTrackingDto,
  ) {
    return this.savedItemsService.createTrackedApplication(user.id, dto);
  }

  @Patch('me/application-tracking/:id')
  @UseGuards(JwtAuthGuard)
  async updateTrackedApplication(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationTrackingDto,
  ) {
    return this.savedItemsService.updateTrackedApplication(user.id, id, dto);
  }

  @Delete('me/application-tracking/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTrackedApplication(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.savedItemsService.deleteTrackedApplication(user.id, id);
  }

  // -------------------------------------------------------------
  // 4. User Preferences
  // -------------------------------------------------------------
  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  async getUserPreferences(@CurrentUser() user: any) {
    return this.savedItemsService.getUserPreferences(user.id);
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard)
  async updateUserPreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.savedItemsService.updateUserPreferences(user.id, dto);
  }

  // -------------------------------------------------------------
  // 5. Account Deletion (GDPR & Privacy)
  // -------------------------------------------------------------
  @Delete('me/account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: any) {
    return this.savedItemsService.deleteUserAccount(user.id);
  }

  // -------------------------------------------------------------
  // 6. Alerts Processing Trigger (Admin / Cron)
  // -------------------------------------------------------------
  @Post('admin/alerts/process-deadlines')
  async processDeadlineAlerts() {
    const results = await this.deadlineAlertsService.processDeadlineAlerts();
    return {
      success: true,
      processedCount: results.length,
      dispatchedCount: results.filter((r) => r.status === 'SENT').length,
      skippedCount: results.filter((r) => r.status === 'SKIPPED_DUPLICATE').length,
      suppressedCount: results.filter((r) => r.status === 'SUPPRESSED_UNSUBSCRIBED').length,
      results,
    };
  }
}
