import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { PropertyCleanerService } from './property-cleaner.service';
import { PropertyCleaner } from './entities/property-cleaner.entity';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { createMockAuthService } from '../../test/mocks/auth-service.mock';
import { createJWTUser } from '../../test/factories/user.factory';
import { AuthService } from '@asset-backend/auth/auth.service';
import { User } from '@asset-backend/people/user/entities/user.entity';

describe('PropertyCleanerService', () => {
  let service: PropertyCleanerService;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;

  beforeEach(async () => {
    mockRepository = createMockRepository<PropertyCleaner>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyCleanerService,
        {
          provide: getRepositoryToken(PropertyCleaner),
          useValue: mockRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<PropertyCleanerService>(PropertyCleanerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByProperty', () => {
    it('should return cleaners when user owns property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [1] });
      const propertyId = 1;
      const mockCleaners = [
        { propertyId: 1, userId: 2, user: { id: 2, firstName: 'John' } as User },
        { propertyId: 1, userId: 3, user: { id: 3, firstName: 'Jane' } as User },
      ];

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.find.mockResolvedValue(mockCleaners);

      const result = await service.findByProperty(user, propertyId);

      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { propertyId },
        relations: ['user'],
      });
      expect(result).toEqual(mockCleaners);
    });

    it('should throw UnauthorizedException when user does not own property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [2] });
      const propertyId = 1;

      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findByProperty(user, propertyId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('should assign cleaner to property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [1] });
      const propertyId = 1;
      const userId = 2;
      const savedCleaner = { propertyId, userId };

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(savedCleaner);

      const result = await service.assign(user, propertyId, userId);

      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.save).toHaveBeenCalledWith({ propertyId, userId });
      expect(result).toEqual(savedCleaner);
    });

    it('should throw UnauthorizedException when user does not own property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [2] });
      const propertyId = 1;
      const userId = 2;

      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.assign(user, propertyId, userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove cleaner from property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [1] });
      const propertyId = 1;
      const userId = 2;

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(user, propertyId, userId);

      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.delete).toHaveBeenCalledWith({ propertyId, userId });
    });

    it('should throw UnauthorizedException when user does not own property', async () => {
      const user = createJWTUser({ id: 1, ownershipInProperties: [2] });
      const propertyId = 1;
      const userId = 2;

      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.remove(user, propertyId, userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(user, propertyId);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPropertiesForCleaner', () => {
    it('should return properties assigned to cleaner', async () => {
      const userId = 2;
      const mockAssignments = [
        { propertyId: 1, userId: 2, property: { id: 1, name: 'Property 1' } },
        { propertyId: 3, userId: 2, property: { id: 3, name: 'Property 3' } },
      ];

      mockRepository.find.mockResolvedValue(mockAssignments);

      const result = await service.getPropertiesForCleaner(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['property'],
      });
      expect(result).toEqual(mockAssignments);
    });
  });

  describe('isCleanerAssigned', () => {
    it('should return true when cleaner is assigned to property', async () => {
      const userId = 2;
      const propertyId = 1;

      mockRepository.count.mockResolvedValue(1);

      const result = await service.isCleanerAssigned(userId, propertyId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { userId, propertyId },
      });
      expect(result).toBe(true);
    });

    it('should return false when cleaner is not assigned to property', async () => {
      const userId = 2;
      const propertyId = 1;

      mockRepository.count.mockResolvedValue(0);

      const result = await service.isCleanerAssigned(userId, propertyId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { userId, propertyId },
      });
      expect(result).toBe(false);
    });
  });
});
