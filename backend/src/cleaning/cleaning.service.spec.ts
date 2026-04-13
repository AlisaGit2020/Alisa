import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { Cleaning } from './entities/cleaning.entity';
import { PropertyCleanerService } from './property-cleaner.service';
import { AuthService } from '@asset-backend/auth/auth.service';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { createMockAuthService } from '../../test/mocks/auth-service.mock';
import { createJWTUser } from '../../test/factories/user.factory';
import { UserRole } from '@asset-backend/common/types';
import { CleaningInputDto } from './dtos/cleaning-input.dto';

describe('CleaningService', () => {
  let service: CleaningService;
  let repository: ReturnType<typeof createMockRepository<Cleaning>>;
  let propertyCleanerService: Partial<
    Record<keyof PropertyCleanerService, jest.Mock>
  >;
  let authService: ReturnType<typeof createMockAuthService>;

  const cleanerUser = createJWTUser({
    id: 10,
    roles: [UserRole.CLEANER],
    ownershipInProperties: [],
  });

  const adminUser = createJWTUser({
    id: 1,
    roles: [UserRole.ADMIN, UserRole.OWNER],
    ownershipInProperties: [1],
  });

  const mockCleaning: Cleaning = {
    id: 1,
    date: new Date('2024-01-15'),
    propertyId: 1,
    userId: 10,
    percentage: 100,
    property: null,
    user: null,
  };

  beforeEach(async () => {
    repository = createMockRepository<Cleaning>();
    authService = createMockAuthService();
    propertyCleanerService = {
      isCleanerAssigned: jest.fn(),
      getPropertiesForCleaner: jest.fn(),
      findByProperty: jest.fn(),
      assign: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleaningService,
        {
          provide: getRepositoryToken(Cleaning),
          useValue: repository,
        },
        {
          provide: PropertyCleanerService,
          useValue: propertyCleanerService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get<CleaningService>(CleaningService);
  });

  describe('addCleaning', () => {
    const input: CleaningInputDto = {
      date: '2024-01-15',
      propertyId: 1,
      percentage: 100,
    };

    it('should create cleaning when cleaner is assigned', async () => {
      propertyCleanerService.isCleanerAssigned.mockResolvedValue(true);
      repository.save.mockResolvedValue(mockCleaning);

      const result = await service.addCleaning(cleanerUser, input);

      expect(propertyCleanerService.isCleanerAssigned).toHaveBeenCalledWith(
        cleanerUser.id,
        input.propertyId,
      );
      expect(repository.save).toHaveBeenCalledWith({
        date: input.date,
        propertyId: input.propertyId,
        userId: cleanerUser.id,
        percentage: input.percentage,
      });
      expect(result).toEqual(mockCleaning);
    });

    it('should throw UnauthorizedException when not assigned', async () => {
      propertyCleanerService.isCleanerAssigned.mockResolvedValue(false);

      await expect(service.addCleaning(cleanerUser, input)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByProperty', () => {
    const cleanings = [mockCleaning];

    beforeEach(() => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(cleanings),
      };
      repository.createQueryBuilder.mockReturnValue(
        queryBuilder as ReturnType<typeof repository.createQueryBuilder>,
      );
    });

    it('should return filtered cleanings', async () => {
      authService.hasOwnership.mockResolvedValue(true);

      const result = await service.findByProperty(adminUser, 1, 1, 2024);

      expect(authService.hasOwnership).toHaveBeenCalledWith(adminUser, 1);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('cleaning');
      expect(result).toEqual(cleanings);
    });

    it('should throw UnauthorizedException when not owner', async () => {
      authService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.findByProperty(adminUser, 1, 1, 2024),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should work without month and year filters', async () => {
      authService.hasOwnership.mockResolvedValue(true);

      const result = await service.findByProperty(adminUser, 1);

      expect(result).toEqual(cleanings);
    });
  });

  describe('findByCleanerUser', () => {
    it('should return own cleanings', async () => {
      const cleanings = [mockCleaning];
      repository.find.mockResolvedValue(cleanings);

      const result = await service.findByCleanerUser(cleanerUser);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: cleanerUser.id },
        relations: ['property'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(cleanings);
    });
  });

  describe('deleteCleaning', () => {
    it('should allow cleaner to delete own cleaning', async () => {
      repository.findOne.mockResolvedValue(mockCleaning);
      repository.delete.mockResolvedValue(undefined);

      await service.deleteCleaning(cleanerUser, 1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(authService.hasOwnership).not.toHaveBeenCalled();
    });

    it('should allow admin to delete on owned property', async () => {
      repository.findOne.mockResolvedValue(mockCleaning);
      repository.delete.mockResolvedValue(undefined);
      authService.hasOwnership.mockResolvedValue(true);

      await service.deleteCleaning(adminUser, 1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(authService.hasOwnership).toHaveBeenCalledWith(adminUser, 1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when cleaner tries to delete other\'s cleaning', async () => {
      const otherCleaning = { ...mockCleaning, userId: 99 };
      repository.findOne.mockResolvedValue(otherCleaning);
      authService.hasOwnership.mockResolvedValue(false);

      await expect(service.deleteCleaning(cleanerUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw when cleaning not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteCleaning(cleanerUser, 999)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
