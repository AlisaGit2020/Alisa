import { IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { FeedbackType } from '../entities/feedback.entity';

export class FeedbackInputDto {
  @IsNotEmpty()
  message: string;

  @IsOptional()
  page?: string;

  @IsIn(['bug', 'feature', 'general'])
  type: FeedbackType = 'general';
}
