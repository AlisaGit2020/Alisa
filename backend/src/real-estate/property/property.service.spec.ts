import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Express } from 'express';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { TierService } from '@alisa-backend/admin/tier.service';
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
  let mockOwnershipRepository: MockRepository<Ownership>;
  let mockAuthService: MockAuthService;
  let mockTierService: Partial<Record<keyof TierService, jest.Mock>>;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [3, 4] });
  const userWithoutProperties = createJWTUser({
    id: 3,
    ownershipInProperties: [],
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Property>();
    mockOwnershipRepository = createMockRepository<Ownership>();
    mockAuthService = createMockAuthService();
    mockTierService = {
      canCreateProperty: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: getRepositoryToken(Property), useValue: mockRepository },
        {
          provide: getRepositoryToken(Ownership),
          useValue: mockOwnershipRepository,
        },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TierService, useValue: mockTierService },
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

    it('returns property with description', async () => {
      const property = createProperty({
        id: 1,
        name: 'Test Property',
        description: 'A nice property with a view',
      });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result.description).toBe('A nice property with a view');
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

    it('creates property with description', async () => {
      const input = {
        name: 'New Property',
        size: 50,
        description: 'A beautiful apartment in the city center',
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.description).toBe(
        'A beautiful apartment in the city center',
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('creates property with address and location fields', async () => {
      const input = {
        name: 'City Apartment',
        size: 65,
        address: 'Mannerheimintie 1 A 5',
        city: 'Helsinki',
        postalCode: '00100',
        buildYear: 1985,
        apartmentType: '3h+k',
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.address).toBe('Mannerheimintie 1 A 5');
      expect(result.city).toBe('Helsinki');
      expect(result.postalCode).toBe('00100');
      expect(result.buildYear).toBe(1985);
      expect(result.apartmentType).toBe('3h+k');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws ForbiddenException when tier property limit is reached', async () => {
      mockTierService.canCreateProperty.mockResolvedValue(false);

      const input = {
        name: 'New Property',
        size: 50,
        ownerships: [{ share: 100, userId: testUser.id }],
      };

      await expect(service.add(testUser, input)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('succeeds when tier allows property creation', async () => {
      mockTierService.canCreateProperty.mockResolvedValue(true);

      const input = {
        name: 'New Property',
        size: 50,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({ id: 1, ...input });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedProperty);
      expect(mockTierService.canCreateProperty).toHaveBeenCalledWith(
        testUser.id,
      );
    });

    it('succeeds when tier is unlimited (maxProperties=0)', async () => {
      mockTierService.canCreateProperty.mockResolvedValue(true);

      const input = {
        name: 'Another Property',
        size: 75,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({ id: 5, ...input });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedProperty);
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

    it('updates property description', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
      });
      const input = {
        name: 'Test Property',
        size: 50,
        description: 'Updated description',
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingProperty, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.description).toBe('Updated description');
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

    it('sets propertyId on ownership when updating with ownership data', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
      });
      const input = {
        name: 'Test Property',
        size: 50,
        ownerships: [{ share: 75, userId: testUser.id }],
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockOwnershipRepository.delete.mockResolvedValue({ affected: 1 });
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(testUser, 1, input);

      expect(mockOwnershipRepository.delete).toHaveBeenCalledWith({
        propertyId: 1,
      });
      expect(result.ownerships).toBeDefined();
      expect(result.ownerships[0].propertyId).toBe(1);
      expect(result.ownerships[0].userId).toBe(testUser.id);
      expect(result.ownerships[0].share).toBe(75);
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

  describe('uploadPhoto', () => {
    it('uploads photo successfully', async () => {
      const property = createProperty({ id: 1 });
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100, // 100KB
        path: 'uploads/properties/1706543210789-test.jpg',
      } as Express.Multer.File;

      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({
        ...property,
        photo: file.path,
      });

      const result = await service.uploadPhoto(testUser, 1, file);

      expect(result.photo).toBe(file.path);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('replaces existing photo', async () => {
      const oldPhotoPath = 'uploads/properties/old-photo.jpg';
      const property = createProperty({ id: 1, photo: oldPhotoPath });
      const file = {
        originalname: 'new.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        path: 'uploads/properties/1706543210789-new.jpg',
      } as Express.Multer.File;

      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({
        ...property,
        photo: file.path,
      });

      const result = await service.uploadPhoto(testUser, 1, file);

      expect(result.photo).toBe(file.path);
    });

    it('throws BadRequestException for invalid file type', async () => {
      const property = createProperty({ id: 1 });
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 100,
        path: 'uploads/properties/document.pdf',
      } as Express.Multer.File;

      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.uploadPhoto(testUser, 1, file)).rejects.toThrow(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    });

    it('throws BadRequestException for file exceeding size limit', async () => {
      const property = createProperty({ id: 1 });
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
        path: 'uploads/properties/large.jpg',
      } as Express.Multer.File;

      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.uploadPhoto(testUser, 1, file)).rejects.toThrow(
        'File size must not exceed 5MB',
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 100,
        path: 'uploads/properties/test.jpg',
      } as Express.Multer.File;

      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.uploadPhoto(otherUser, 1, file)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('deletePhoto', () => {
    it('deletes photo successfully', async () => {
      const property = createProperty({
        id: 1,
        photo: 'uploads/properties/1706543210789-test.jpg',
      });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...property, photo: null });

      const result = await service.deletePhoto(testUser, 1);

      expect(result.photo).toBeNull();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when property has no photo', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.deletePhoto(testUser, 1)).rejects.toThrow(
        'Property does not have a photo',
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({
        id: 1,
        photo: 'uploads/properties/1706543210789-test.jpg',
      });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.deletePhoto(otherUser, 1)).rejects.toThrow(
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

    it('handles undefined options without throwing', async () => {
      const properties = [createProperty({ id: 1, name: 'Property 1' })];
      mockRepository.find.mockResolvedValue(properties);

      const result = await service.search(testUser, undefined);

      expect(result).toEqual(properties);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('handles null options without throwing', async () => {
      const properties = [createProperty({ id: 1, name: 'Property 1' })];
      mockRepository.find.mockResolvedValue(properties);

      const result = await service.search(testUser, null);

      expect(result).toEqual(properties);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});
