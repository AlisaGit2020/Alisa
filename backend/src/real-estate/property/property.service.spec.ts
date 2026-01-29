import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createProperty, createJWTUser } from 'test/factories';

describe('PropertyService', () => {
  let service: PropertyService;
  let mockRepository: MockRepository<Property>;
  let mockAuthService: MockAuthService;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [3, 4] });
  const userWithoutProperties = createJWTUser({
    id: 3,
    ownershipInProperties: [],
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Property>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: getRepositoryToken(Property), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
  });

  describe('findOne', () => {
    it('returns property when user has ownership', async () => {
      const property = createProperty({ id: 1, name: 'Test Property' });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(property);
    });

    it('returns null when property does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(userWithoutProperties, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates property with ownership', async () => {
      const input = {
        name: 'New Property',
        size: 50,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedProperty);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('adds default ownership when not provided', async () => {
      const input = {
        name: 'New Property',
        size: 50,
        ownerships: undefined,
      };
      const savedProperty = createProperty({ id: 1, name: 'New Property' });
      mockRepository.save.mockResolvedValue(savedProperty);

      await service.add(testUser, input);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates property', async () => {
      const existingProperty = createProperty({ id: 1, name: 'Old Name' });
      const input = { name: 'New Name', size: 36.5 };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingProperty, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.name).toBe('New Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, { name: 'Test', size: 50 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.update(otherUser, 1, { name: 'Test', size: 50 }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deletes property', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.delete(userWithoutProperties, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('search', () => {
    it('returns properties for user', async () => {
      const properties = [
        createProperty({ id: 1, name: 'Property 1' }),
        createProperty({ id: 2, name: 'Property 2' }),
      ];
      mockRepository.find.mockResolvedValue(properties);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.search(testUser, {});

      expect(result).toEqual(properties);
    });

    it('returns empty array for user without properties', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search(userWithoutProperties, {});

      expect(result).toEqual([]);
    });

    it('throws UnauthorizedException when searching for another user property by id', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.search(otherUser, { where: { id: 1 } }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
