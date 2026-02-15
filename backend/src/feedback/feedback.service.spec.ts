import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { FeedbackInputDto } from './dtos/feedback-input.dto';
import { createJWTUser } from 'test/factories';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockRepository: Partial<Record<keyof Repository<Feedback>, jest.Mock>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  describe('create', () => {
    it('creates feedback with user id', async () => {
      const user = createJWTUser({ id: 1 });
      const input: FeedbackInputDto = {
        message: 'Test feedback message',
        type: 'general',
        page: '/dashboard',
      };

      const createdFeedback = {
        id: 1,
        ...input,
        userId: user.id,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(createdFeedback);

      const result = await service.create(user, input);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...input,
        userId: user.id,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdFeedback);
      expect(result).toEqual(createdFeedback);
    });

    it('creates bug report feedback', async () => {
      const user = createJWTUser({ id: 2 });
      const input: FeedbackInputDto = {
        message: 'Found a bug',
        type: 'bug',
        page: '/properties',
      };

      const createdFeedback = {
        id: 2,
        ...input,
        userId: user.id,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(createdFeedback);

      const result = await service.create(user, input);

      expect(result.type).toBe('bug');
      expect(result.userId).toBe(user.id);
    });

    it('creates feature request feedback', async () => {
      const user = createJWTUser({ id: 3 });
      const input: FeedbackInputDto = {
        message: 'Please add dark mode',
        type: 'feature',
      };

      const createdFeedback = {
        id: 3,
        ...input,
        userId: user.id,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(createdFeedback);

      const result = await service.create(user, input);

      expect(result.type).toBe('feature');
    });
  });

  describe('findAll', () => {
    it('returns all feedback ordered by createdAt DESC', async () => {
      const feedbackList = [
        { id: 2, message: 'Second', createdAt: new Date('2024-02-01') },
        { id: 1, message: 'First', createdAt: new Date('2024-01-01') },
      ];

      mockRepository.find.mockResolvedValue(feedbackList);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(feedbackList);
    });

    it('returns empty array when no feedback exists', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('returns feedback for specific user', async () => {
      const userId = 5;
      const userFeedback = [
        { id: 1, message: 'User feedback', userId, createdAt: new Date() },
      ];

      mockRepository.find.mockResolvedValue(userFeedback);

      const result = await service.findByUser(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userFeedback);
    });

    it('returns empty array when user has no feedback', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(999);

      expect(result).toEqual([]);
    });
  });
});
