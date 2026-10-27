import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { SubmitFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  EligibilityAssessment,
  RecommendationTargetType,
} from '@startup-radar/shared-types';

@Controller('recommendations')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @CurrentUser() user: any,
    @Query('targetType') targetType?: RecommendationTargetType,
    @Query('assessment') assessment?: EligibilityAssessment,
  ) {
    return this.intelligenceService.getRecommendations(user.id, {
      targetType,
      assessment,
    });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getIntelligenceSummary(@CurrentUser() user: any) {
    return this.intelligenceService.getIntelligenceSummary(user.id);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateRecommendations(@CurrentUser() user: any) {
    return this.intelligenceService.generateRecommendations(user.id);
  }

  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitFeedback(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.intelligenceService.submitFeedback(user.id, id, dto);
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async dismissRecommendation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.intelligenceService.dismissRecommendation(user.id, id);
  }
}
