import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoFounderService } from './co-founder.service';
import { CreateFounderProfileDto } from './dto/create-founder-profile.dto';
import { SearchFoundersDto } from './dto/search-founders.dto';
import {
  RespondConnectionRequestDto,
  SendConnectionRequestDto,
} from './dto/connection-request.dto';
import { BlockUserDto, ReportProfileDto } from './dto/moderation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('founders')
export class CoFounderController {
  constructor(private readonly coFounderService: CoFounderService) {}

  // -------------------------------------------------------------
  // 1. Own Profile
  // -------------------------------------------------------------
  @Post('me')
  @UseGuards(JwtAuthGuard)
  async saveOwnProfile(
    @CurrentUser() user: any,
    @Body() dto: CreateFounderProfileDto,
  ) {
    return this.coFounderService.createOrUpdateProfile(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getOwnProfile(@CurrentUser() user: any) {
    return this.coFounderService.getOwnProfile(user.id);
  }

  @Get('me/recommendations')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@CurrentUser() user: any) {
    return this.coFounderService.getRecommendations(user.id);
  }

  // -------------------------------------------------------------
  // 2. Connection Requests
  // -------------------------------------------------------------
  @Get('connection-requests')
  @UseGuards(JwtAuthGuard)
  async getConnectionRequests(
    @CurrentUser() user: any,
    @Query('type') type?: 'all' | 'sent' | 'received',
  ) {
    return this.coFounderService.getConnectionRequests(user.id, type || 'all');
  }

  @Post('connection-requests')
  @UseGuards(JwtAuthGuard)
  async sendConnectionRequest(
    @CurrentUser() user: any,
    @Body() dto: SendConnectionRequestDto,
  ) {
    return this.coFounderService.sendConnectionRequest(user.id, dto);
  }

  @Patch('connection-requests/:id/respond')
  @UseGuards(JwtAuthGuard)
  async respondConnectionRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RespondConnectionRequestDto,
  ) {
    return this.coFounderService.respondConnectionRequest(user.id, id, dto);
  }

  @Post('connection-requests/:id/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawConnectionRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.coFounderService.withdrawConnectionRequest(user.id, id);
  }

  // -------------------------------------------------------------
  // 3. Moderation (Block & Report)
  // -------------------------------------------------------------
  @Post(':targetUserId/block')
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @CurrentUser() user: any,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.coFounderService.blockUser(user.id, targetUserId, dto);
  }

  @Post(':profileId/report')
  @UseGuards(JwtAuthGuard)
  async reportProfile(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
    @Body() dto: ReportProfileDto,
  ) {
    return this.coFounderService.reportProfile(user.id, profileId, dto);
  }

  // -------------------------------------------------------------
  // 4. Discovery & Profile View
  // -------------------------------------------------------------
  @Get()
  async searchFounders(@Query() query: SearchFoundersDto) {
    return this.coFounderService.searchFounders(null, query);
  }

  @Get(':id')
  async getProfileById(@Param('id') id: string) {
    return this.coFounderService.getProfileById(id, false);
  }
}
