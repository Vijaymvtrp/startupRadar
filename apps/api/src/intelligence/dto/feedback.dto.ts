import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RecommendationFeedback } from '@startup-radar/shared-types';

export class SubmitFeedbackDto {
  @IsNotEmpty()
  @IsEnum(RecommendationFeedback)
  feedback: RecommendationFeedback;

  @IsOptional()
  @IsString()
  comments?: string;
}
