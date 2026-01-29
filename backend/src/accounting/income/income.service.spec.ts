import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IncomeService } from './income.service';
import { Income } from './entities/income.entity';
import { IncomeType } from './entities/income-type.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createIncome, createJWTUser } from 'test/factories';

describe('IncomeService', () => {
  let service: IncomeService;
  let mockRepository: MockRepository<Income>;
  let mockPropertyRepository: MockRepository<Property>;
  let mockIncomeTypeRepository: MockRepository<IncomeType>;
  let mockTransactionRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [3, 4] });
  const userWithoutProperties = createJWTUser({
    id: 3,
    ownershipInProperties: [],
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Income>();
    mockPropertyRepository = createMockRepository<Property>();
    mockIncomeTypeRepository = createMockRepository<IncomeType>();
    mockTransactionRepository = createMockRepository<Transaction>();
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        { provide: getRepositoryToken(Income), useValue: mockRepository },
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
        {
          provide: getRepositoryToken(IncomeType),
          useValue: mockIncomeTypeRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);
  });

  describe('findOne', () => {
    it('returns income when user has ownership', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(income);
    });

    it('returns null when income does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates income when user has ownership', async () => {
      const input = {
        propertyId: 1,
        incomeTypeId: 1,
        description: 'Test income',
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      };
      const savedIncome = createIncome({ id: 1, ...input });

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(savedIncome);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedIncome);
    });

    it('throws UnauthorizedException when user has no property access', async () => {
      const input = {
        propertyId: 1,
        incomeTypeId: 1,
        description: 'Test income',
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      };

      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.add(otherUser, input)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    it('updates income', async () => {
      const existingIncome = createIncome({ id: 1, propertyId: 1 });
      const input = {
        description: 'Updated income',
        amount: 200,
        quantity: 1,
        totalAmount: 200,
      };

      mockRepository.findOne.mockResolvedValue(existingIncome);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingIncome, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.description).toBe('Updated income');
    });

    it('throws NotFoundException when income does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, {
          description: 'Test',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.update(userWithoutProperties, 1, {
          description: 'Test',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deletes income', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when income does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.delete(userWithoutProperties, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('search', () => {
    it('returns incomes with ownership filter applied', async () => {
      const incomes = [
        createIncome({ id: 1, propertyId: 1 }),
        createIncome({ id: 2, propertyId: 1 }),
      ];
      mockRepository.find.mockResolvedValue(incomes);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {});

      expect(result).toEqual(incomes);
      expect(mockAuthService.addOwnershipFilter).toHaveBeenCalled();
    });

    it('returns empty array for user without incomes', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(userWithoutProperties, {});

      expect(result).toEqual([]);
    });
  });
});
