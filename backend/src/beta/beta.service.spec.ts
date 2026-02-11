import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BetaService } from './beta.service';
import { BetaSignup } from './entities/beta-signup.entity';
import { createMockRepository, MockRepository } from 'test/mocks';

describe('BetaService', () => {
  let service: BetaService;
  let mockRepository: MockRepository<BetaSignup>;

  const createBetaSignup = (options: Partial<BetaSignup> = {}): BetaSignup => {
    const signup = new BetaSignup();
    signup.id = options.id ?? 1;
    signup.email = options.email ?? 'test@example.com';
    signup.signupDate = options.signupDate ?? new Date();
    signup.status = options.status ?? 'pending';
    signup.invitedAt = options.invitedAt ?? null;
    signup.notes = options.notes ?? null;
    return signup;
  };

  beforeEach(async () => {
    mockRepository = createMockRepository<BetaSignup>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetaService,
        { provide: getRepositoryToken(BetaSignup), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<BetaService>(BetaService);
  });

  describe('signup', () => {
    it('creates signup for valid email', async () => {
      const input = { email: 'test@example.com' };
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createBetaSignup(input));
      mockRepository.save.mockResolvedValue(createBetaSignup(input));

      const result = await service.signup(input);

      expect(result).toEqual({
        success: true,
        message: 'Successfully signed up for beta.',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: 'pending',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate email', async () => {
      const input = { email: 'test@example.com' };
      mockRepository.findOneBy.mockResolvedValue(createBetaSignup(input));

      await expect(service.signup(input)).rejects.toThrow(ConflictException);
      await expect(service.signup(input)).rejects.toThrow(
        'This email is already registered.',
      );
    });

    it('normalizes email to lowercase', async () => {
      const input = { email: 'TEST@EXAMPLE.COM' };
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(
        createBetaSignup({ email: 'test@example.com' }),
      );
      mockRepository.save.mockResolvedValue(
        createBetaSignup({ email: 'test@example.com' }),
      );

      await service.signup(input);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: 'pending',
      });
    });

    it('trims whitespace from email', async () => {
      const input = { email: '  test@example.com  ' };
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(
        createBetaSignup({ email: 'test@example.com' }),
      );
      mockRepository.save.mockResolvedValue(
        createBetaSignup({ email: 'test@example.com' }),
      );

      await service.signup(input);

      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: 'pending',
      });
    });
  });

  describe('findAll', () => {
    it('returns all signups ordered by date descending', async () => {
      const signups = [
        createBetaSignup({ id: 2, email: 'second@example.com' }),
        createBetaSignup({ id: 1, email: 'first@example.com' }),
      ];
      mockRepository.find.mockResolvedValue(signups);

      const result = await service.findAll();

      expect(result).toEqual(signups);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { signupDate: 'DESC' },
      });
    });

    it('returns empty array when no signups exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns signup when found', async () => {
      const signup = createBetaSignup({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(signup);

      const result = await service.findOne(1);

      expect(result).toEqual(signup);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws NotFoundException when signup not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Beta signup with id 999 not found',
      );
    });
  });
});
