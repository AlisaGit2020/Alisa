import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { FeedbackInputDto } from './dtos/feedback-input.dto';
import { JWTUser } from '@asset-backend/auth/types';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private repository: Repository<Feedback>,
  ) {}

  async create(user: JWTUser, input: FeedbackInputDto): Promise<Feedback> {
    const feedback = this.repository.create({
      ...input,
      userId: user.id,
    });
    return this.repository.save(feedback);
  }

  async findAll(): Promise<Feedback[]> {
    return this.repository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Feedback[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
