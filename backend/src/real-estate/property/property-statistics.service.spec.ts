import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyStatisticsService } from './property-statistics.service';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createTransaction, createJWTUser } from 'test/factories';
import {
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { DataSource } from 'typeorm';

describe('PropertyStatisticsService', () => {
  let service: PropertyStatisticsService;
  let mockRepository: MockRepository<PropertyStatistics>;
  let mockDataSource: { query: jest.Mock };
  let mockPropertyService: { search: jest.Mock };
  let mockAuthService: { hasOwnership: jest.Mock };

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });

  beforeEach(async () => {
    mockRepository = createMockRepository<PropertyStatistics>();
    mockDataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };
    mockPropertyService = {
      search: jest.fn().mockResolvedValue([]),
    };
    mockAuthService = {
      hasOwnership: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyStatisticsService,
        {
          provide: getRepositoryToken(PropertyStatistics),
          useValue: mockRepository,
        },
        {
          provide: PropertyService,
          useValue: mockPropertyService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<PropertyStatisticsService>(PropertyStatisticsService);
  });

  describe('search', () => {
    it('returns statistics when they exist', async () => {
      const statistics = [
        {
          propertyId: 1,
          key: StatisticKey.BALANCE,
          year: null,
          month: null,
          value: '1000.00',
        } as PropertyStatistics,
      ];

      mockRepository.find.mockResolvedValue(statistics);

      const result = await service.search(testUser, {
        propertyId: 1,
        key: StatisticKey.BALANCE,
      });

      expect(result).toEqual(statistics);
    });

    it('returns default zero value when no statistics exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search(testUser, {
        propertyId: 1,
        key: StatisticKey.BALANCE,
      });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('0.00');
      expect(result[0].key).toBe(StatisticKey.BALANCE);
    });

    it('returns empty array when no key specified and no data', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search(testUser, {
        propertyId: 1,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when user does not own the property', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(false);
      mockRepository.find.mockResolvedValue([
        { propertyId: 999, key: StatisticKey.BALANCE, value: '1000.00' },
      ]);

      const result = await service.search(testUser, {
        propertyId: 999,
        key: StatisticKey.BALANCE,
      });

      expect(result).toEqual([]);
      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(testUser, 999);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('handleTransactionCreated', () => {
    it('calls upsert for all time, yearly, and monthly statistics', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      // Should be called for BALANCE and INCOME (the relevant types for INCOME transaction)
      // × 3 time periods (all time, yearly, monthly) = 6 calls
      expect(mockDataSource.query).toHaveBeenCalled();

      // Verify the SQL contains ON CONFLICT for atomic upsert
      const calls = mockDataSource.query.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('ON CONFLICT');
      expect(calls[0][0]).toContain('INSERT INTO property_statistics');
    });

    it('does not create statistics for pending transactions', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.PENDING,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('uses correct delta for income transactions', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      // Find the call for INCOME key - delta should be positive
      const incomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.INCOME,
      );
      expect(incomeCalls.length).toBeGreaterThan(0);
      // The 5th parameter (delta as string) and 6th (delta as number)
      expect(incomeCalls[0][1][4]).toBe('100.00');
      expect(incomeCalls[0][1][5]).toBe(100);
    });

    it('uses positive delta for expense transactions', async () => {
      // Real expense transactions have negative amounts (e.g., -50)
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: -50,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      // Find the call for EXPENSE key - delta should be positive (negated from -50)
      const expenseCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.EXPENSE,
      );
      expect(expenseCalls.length).toBeGreaterThan(0);
      // The 5th parameter (delta as string) and 6th (delta as number) should be positive
      expect(expenseCalls[0][1][4]).toBe('50.00');
      expect(expenseCalls[0][1][5]).toBe(50);
    });
  });

  describe('handleTransactionDeleted', () => {
    it('uses negative delta when deleting income transaction', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionDeleted({ transaction });

      // For deletion, the delta should be negative (subtracting)
      const incomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.INCOME,
      );
      expect(incomeCalls.length).toBeGreaterThan(0);
      expect(incomeCalls[0][1][4]).toBe('-100.00');
      expect(incomeCalls[0][1][5]).toBe(-100);
    });

    it('does not update statistics for pending transactions', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.PENDING,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionDeleted({ transaction });

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('uses negative delta when deleting expense transaction', async () => {
      // Real expense transactions have negative amounts (e.g., -50)
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: -50,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionDeleted({ transaction });

      // For deletion of expense, delta becomes negative (subtracting the positive stored value)
      const expenseCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.EXPENSE,
      );
      expect(expenseCalls.length).toBeGreaterThan(0);
      expect(expenseCalls[0][1][4]).toBe('-50.00');
      expect(expenseCalls[0][1][5]).toBe(-50);
    });
  });
});
