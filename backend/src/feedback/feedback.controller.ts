import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackInputDto } from './dtos/feedback-input.dto';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { Feedback } from './entities/feedback.entity';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Req() req,
    @Body() input: FeedbackInputDto,
  ): Promise<Feedback> {
    return this.feedbackService.create(req.user, input);
  }
}
