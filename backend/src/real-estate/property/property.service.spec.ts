import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
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
import {
  createProperty,
  createJWTUser,
  createTransaction,
  createExpense,
  createIncome,
} from 'test/factories';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { DepreciationAsset } from '@alisa-backend/accounting/depreciation/entities/depreciation-asset.entity';
import {
  PropertyExternalSource,
  PropertyStatus,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

describe('PropertyService', () => {
  let service: PropertyService;
  let mockRepository: MockRepository<Property>;
  let mockOwnershipRepository: MockRepository<Ownership>;
  let mockTransactionRepository: MockRepository<Transaction>;
  let mockExpenseRepository: MockRepository<Expense>;
  let mockIncomeRepository: MockRepository<Income>;
  let mockStatisticsRepository: MockRepository<PropertyStatistics>;
  let mockDepreciationAssetRepository: MockRepository<DepreciationAsset>;
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
    mockTransactionRepository = createMockRepository<Transaction>();
    mockExpenseRepository = createMockRepository<Expense>();
    mockIncomeRepository = createMockRepository<Income>();
    mockStatisticsRepository = createMockRepository<PropertyStatistics>();
    mockDepreciationAssetRepository = createMockRepository<DepreciationAsset>();
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
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(Income),
          useValue: mockIncomeRepository,
        },
        {
          provide: getRepositoryToken(PropertyStatistics),
          useValue: mockStatisticsRepository,
        },
        {
          provide: getRepositoryToken(DepreciationAsset),
          useValue: mockDepreciationAssetRepository,
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
        address: {
          street: 'Mannerheimintie 1 A 5',
          city: 'Helsinki',
          postalCode: '00100',
        },
        buildYear: 1985,
        apartmentType: '3h+k',
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        address: input.address,
        buildYear: input.buildYear,
        apartmentType: input.apartmentType,
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.address?.street).toBe('Mannerheimintie 1 A 5');
      expect(result.address?.city).toBe('Helsinki');
      expect(result.address?.postalCode).toBe('00100');
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

    it('creates property with PROSPECT status', async () => {
      const input = {
        name: 'Prospect Property',
        size: 60,
        status: PropertyStatus.PROSPECT,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        status: PropertyStatus.PROSPECT,
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.status).toBe(PropertyStatus.PROSPECT);
    });

    it('creates property with SOLD status', async () => {
      const input = {
        name: 'Sold Property',
        size: 55,
        status: PropertyStatus.SOLD,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        status: PropertyStatus.SOLD,
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.status).toBe(PropertyStatus.SOLD);
    });

    it('creates property with external source fields', async () => {
      const input = {
        name: 'Oikotie Property',
        size: 70,
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: '12345678',
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: '12345678',
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.externalSource).toBe(PropertyExternalSource.OIKOTIE);
      expect(result.externalSourceId).toBe('12345678');
    });

    it('creates property with Etuovi external source', async () => {
      const input = {
        name: 'Etuovi Property',
        size: 65,
        externalSource: PropertyExternalSource.ETUOVI,
        externalSourceId: 'ET-987654',
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        externalSource: PropertyExternalSource.ETUOVI,
        externalSourceId: 'ET-987654',
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.externalSource).toBe(PropertyExternalSource.ETUOVI);
      expect(result.externalSourceId).toBe('ET-987654');
    });

    it('defaults status to OWN when not provided', async () => {
      const input = {
        name: 'Default Status Property',
        size: 50,
        ownerships: [{ share: 100, userId: testUser.id }],
      };
      const savedProperty = createProperty({
        id: 1,
        name: input.name,
        size: input.size,
        status: PropertyStatus.OWN,
      });
      mockRepository.save.mockResolvedValue(savedProperty);

      const result = await service.add(testUser, input);

      expect(result.status).toBe(PropertyStatus.OWN);
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

    it('handles null address without throwing error', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
      });
      // Input with address: null (as returned by TypeORM when no address exists)
      const input = {
        name: 'Updated Name',
        size: 50,
        address: null as unknown as undefined,
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(testUser, 1, input);

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('updates property status from PROSPECT to OWN', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.PROSPECT,
      });
      const input = {
        name: 'Test Property',
        size: 50,
        status: PropertyStatus.OWN,
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingProperty, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.status).toBe(PropertyStatus.OWN);
    });

    it('updates property status from OWN to SOLD', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
        status: PropertyStatus.OWN,
      });
      const input = {
        name: 'Test Property',
        size: 50,
        status: PropertyStatus.SOLD,
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingProperty, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.status).toBe(PropertyStatus.SOLD);
    });

    it('updates external source fields', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
      });
      const input = {
        name: 'Test Property',
        size: 50,
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: 'OT-123456',
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingProperty, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.externalSource).toBe(PropertyExternalSource.OIKOTIE);
      expect(result.externalSourceId).toBe('OT-123456');
    });

    it('clears external source fields when set to null', async () => {
      const existingProperty = createProperty({
        id: 1,
        name: 'Test Property',
        externalSource: PropertyExternalSource.OIKOTIE,
        externalSourceId: 'OT-123456',
      });
      // Simulates frontend sending null to clear fields
      const input = {
        name: 'Test Property',
        size: 50,
        externalSource: null,
        externalSourceId: null,
      };

      mockRepository.findOneBy.mockResolvedValue(existingProperty);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(testUser, 1, input);

      expect(result.externalSource).toBeNull();
      expect(result.externalSourceId).toBeNull();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Default: no dependencies
      mockTransactionRepository.count.mockResolvedValue(0);
      mockExpenseRepository.count.mockResolvedValue(0);
      mockIncomeRepository.count.mockResolvedValue(0);
      mockStatisticsRepository.count.mockResolvedValue(0);
      mockDepreciationAssetRepository.count.mockResolvedValue(0);
    });

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

    it('throws BadRequestException when dependencies exist', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.count.mockResolvedValue(5);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({ id: 1, propertyId: 1 }),
      ]);

      await expect(service.delete(testUser, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('does not call repository.delete when dependencies exist', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockExpenseRepository.count.mockResolvedValue(3);
      mockExpenseRepository.find.mockResolvedValue([
        createExpense({ id: 1, propertyId: 1 }),
      ]);

      try {
        await service.delete(testUser, 1);
      } catch {
        // Expected
      }

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateDelete', () => {
    beforeEach(() => {
      // Default: no dependencies
      mockTransactionRepository.count.mockResolvedValue(0);
      mockExpenseRepository.count.mockResolvedValue(0);
      mockIncomeRepository.count.mockResolvedValue(0);
      mockStatisticsRepository.count.mockResolvedValue(0);
      mockDepreciationAssetRepository.count.mockResolvedValue(0);
    });

    it('returns canDelete: true for property without dependencies', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const { validation, property: returnedProperty } =
        await service.validateDelete(testUser, 1);

      expect(validation.canDelete).toBe(true);
      expect(validation.dependencies).toEqual([]);
      expect(validation.message).toBeUndefined();
      expect(returnedProperty).toEqual(property);
    });

    it('returns canDelete: false with transaction dependency', async () => {
      const property = createProperty({ id: 1 });
      const transactions = [
        createTransaction({ id: 1, propertyId: 1, description: 'Trans 1' }),
        createTransaction({ id: 2, propertyId: 1, description: 'Trans 2' }),
      ];
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.count.mockResolvedValue(2);
      mockTransactionRepository.find.mockResolvedValue(transactions);

      const { validation } = await service.validateDelete(testUser, 1);

      expect(validation.canDelete).toBe(false);
      expect(validation.dependencies).toHaveLength(1);
      expect(validation.dependencies[0].type).toBe('transaction');
      expect(validation.dependencies[0].count).toBe(2);
      expect(validation.dependencies[0].samples).toHaveLength(2);
      expect(validation.message).toBeDefined();
    });

    it('returns multiple dependency types', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      mockTransactionRepository.count.mockResolvedValue(5);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({ id: 1, propertyId: 1 }),
      ]);

      mockExpenseRepository.count.mockResolvedValue(3);
      mockExpenseRepository.find.mockResolvedValue([
        createExpense({ id: 1, propertyId: 1 }),
      ]);

      mockIncomeRepository.count.mockResolvedValue(2);
      mockIncomeRepository.find.mockResolvedValue([
        createIncome({ id: 1, propertyId: 1 }),
      ]);

      const { validation } = await service.validateDelete(testUser, 1);

      expect(validation.canDelete).toBe(false);
      expect(validation.dependencies).toHaveLength(3);
      expect(validation.dependencies.map((d) => d.type)).toContain('transaction');
      expect(validation.dependencies.map((d) => d.type)).toContain('expense');
      expect(validation.dependencies.map((d) => d.type)).toContain('income');
    });

    it('throws NotFoundException for missing property', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.validateDelete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException for non-owner', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.validateDelete(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('limits samples to 5 items', async () => {
      const property = createProperty({ id: 1 });
      const manyTransactions = Array.from({ length: 10 }, (_, i) =>
        createTransaction({ id: i + 1, propertyId: 1 }),
      );
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.count.mockResolvedValue(10);
      mockTransactionRepository.find.mockResolvedValue(
        manyTransactions.slice(0, 5),
      );

      const { validation } = await service.validateDelete(testUser, 1);

      expect(validation.dependencies[0].count).toBe(10);
      expect(validation.dependencies[0].samples).toHaveLength(5);
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

  describe('searchTransactions', () => {
    it('returns transactions for owned property', async () => {
      const property = createProperty({ id: 1 });
      const transactions = [
        createTransaction({
          id: 1,
          propertyId: 1,
          status: TransactionStatus.ACCEPTED,
        }),
        createTransaction({
          id: 2,
          propertyId: 1,
          status: TransactionStatus.ACCEPTED,
        }),
      ];
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.searchTransactions(testUser, 1, {});

      expect(result).toEqual(transactions);
      expect(mockTransactionRepository.find).toHaveBeenCalled();
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.searchTransactions(testUser, 999, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.searchTransactions(otherUser, 1, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('filters by year when provided', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.searchTransactions(testUser, 1, { year: 2023 });

      expect(mockTransactionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: 1,
            status: TransactionStatus.ACCEPTED,
            transactionDate: expect.any(Object),
          }),
        }),
      );
    });

    it('filters by year and month when both provided', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.searchTransactions(testUser, 1, { year: 2023, month: 6 });

      expect(mockTransactionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: 1,
            status: TransactionStatus.ACCEPTED,
            transactionDate: expect.any(Object),
          }),
        }),
      );
    });

    it('filters by transaction type when provided', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.searchTransactions(testUser, 1, {
        type: TransactionType.INCOME,
      });

      expect(mockTransactionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: 1,
            status: TransactionStatus.ACCEPTED,
            type: TransactionType.INCOME,
          }),
        }),
      );
    });

    it('applies skip and take pagination', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.searchTransactions(testUser, 1, { skip: 10, take: 20 });

      expect(mockTransactionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        }),
      );
    });

    it('orders by transactionDate DESC', async () => {
      const property = createProperty({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.searchTransactions(testUser, 1, {});

      expect(mockTransactionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { transactionDate: 'DESC' },
        }),
      );
    });
  });
});
