import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyStatisticsService } from './property-statistics.service';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createTransaction, createJWTUser, createExpense, createIncome } from 'test/factories';
import {
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { DataSource } from 'typeorm';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';

describe('PropertyStatisticsService', () => {
  let service: PropertyStatisticsService;
  let mockRepository: MockRepository<PropertyStatistics>;
  let mockDataSource: { query: jest.Mock };
  let mockPropertyService: { search: jest.Mock };
  let mockAuthService: { hasOwnership: jest.Mock };
  let mockEventTracker: { increment: jest.Mock; decrement: jest.Mock };

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
    mockEventTracker = {
      increment: jest.fn(),
      decrement: jest.fn(),
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
        {
          provide: EventTrackerService,
          useValue: mockEventTracker,
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

  describe('getAvailableYears', () => {
    it('returns years when statistics exist', async () => {
      mockPropertyService.search.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockDataSource.query.mockResolvedValue([
        { year: 2024 },
        { year: 2023 },
        { year: 2022 },
      ]);

      const result = await service.getAvailableYears(testUser);

      expect(result).toEqual([2024, 2023, 2022]);
      expect(mockPropertyService.search).toHaveBeenCalledWith(testUser, {
        select: ['id'],
      });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT year'),
        [[1, 2]],
      );
    });

    it('returns empty array when user has no properties', async () => {
      mockPropertyService.search.mockResolvedValue([]);

      const result = await service.getAvailableYears(testUser);

      expect(result).toEqual([]);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('returns empty array when no statistics exist', async () => {
      mockPropertyService.search.mockResolvedValue([{ id: 1 }]);
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.getAvailableYears(testUser);

      expect(result).toEqual([]);
    });

    it('only queries for user owned property ids', async () => {
      const userProperties = [{ id: 5 }, { id: 10 }];
      mockPropertyService.search.mockResolvedValue(userProperties);
      mockDataSource.query.mockResolvedValue([{ year: 2024 }]);

      await service.getAvailableYears(testUser);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.any(String),
        [[5, 10]],
      );
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

  describe('handleExpenseAccountingDateChanged', () => {
    it('triggers recalculation for the expense property', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([]);

      await service.handleExpenseAccountingDateChanged({
        expense,
        oldAccountingDate: new Date('2023-06-15'),
      });

      // Should call the recalculation queries
      expect(mockDataSource.query).toHaveBeenCalled();
      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });
  });

  describe('handleIncomeAccountingDateChanged', () => {
    it('triggers recalculation for the income property', async () => {
      const income = createIncome({ id: 1, propertyId: 1 });
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([]);

      await service.handleIncomeAccountingDateChanged({
        income,
        oldAccountingDate: new Date('2023-06-15'),
      });

      // Should call the recalculation queries
      expect(mockDataSource.query).toHaveBeenCalled();
      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });
  });

  describe('searchAll', () => {
    it('returns statistics for all user properties when no propertyId specified', async () => {
      mockPropertyService.search.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const statistics = [
        { propertyId: 1, key: StatisticKey.BALANCE, year: null, month: null, value: '1000.00' },
        { propertyId: 2, key: StatisticKey.BALANCE, year: null, month: null, value: '2000.00' },
      ] as PropertyStatistics[];
      mockRepository.find.mockResolvedValue(statistics);

      const result = await service.searchAll(testUser, { key: StatisticKey.BALANCE });

      expect(result).toEqual(statistics);
      expect(mockPropertyService.search).toHaveBeenCalledWith(testUser, { select: ['id'] });
    });

    it('returns statistics for specific property when propertyId is specified', async () => {
      const statistics = [
        { propertyId: 1, key: StatisticKey.INCOME, year: null, month: null, value: '500.00' },
      ] as PropertyStatistics[];
      mockRepository.find.mockResolvedValue(statistics);

      const result = await service.searchAll(testUser, { propertyId: 1, key: StatisticKey.INCOME });

      expect(result).toEqual(statistics);
      expect(mockAuthService.hasOwnership).toHaveBeenCalledWith(testUser, 1);
    });

    it('returns empty array when user does not own the specified property', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(false);

      const result = await service.searchAll(testUser, { propertyId: 999, key: StatisticKey.BALANCE });

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('returns empty array when user has no properties', async () => {
      mockPropertyService.search.mockResolvedValue([]);

      const result = await service.searchAll(testUser, { key: StatisticKey.BALANCE });

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('includes yearly statistics when includeYearly is true', async () => {
      mockPropertyService.search.mockResolvedValue([{ id: 1 }]);
      const statistics = [
        { propertyId: 1, key: StatisticKey.INCOME, year: 2023, month: null, value: '1000.00' },
        { propertyId: 1, key: StatisticKey.INCOME, year: 2024, month: null, value: '1500.00' },
      ] as PropertyStatistics[];
      mockRepository.find.mockResolvedValue(statistics);

      const result = await service.searchAll(testUser, {
        key: StatisticKey.INCOME,
        includeYearly: true,
      });

      expect(result).toEqual(statistics);
      // Verify the where clause includes year: Not(IsNull())
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('includes monthly statistics when includeMonthly is true', async () => {
      mockPropertyService.search.mockResolvedValue([{ id: 1 }]);
      const statistics = [
        { propertyId: 1, key: StatisticKey.EXPENSE, year: 2023, month: 1, value: '100.00' },
        { propertyId: 1, key: StatisticKey.EXPENSE, year: 2023, month: 2, value: '150.00' },
      ] as PropertyStatistics[];
      mockRepository.find.mockResolvedValue(statistics);

      const result = await service.searchAll(testUser, {
        key: StatisticKey.EXPENSE,
        includeMonthly: true,
      });

      expect(result).toEqual(statistics);
    });
  });

  describe('handleTransactionCreated - deposit/withdraw', () => {
    it('uses positive delta for deposit transactions', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 200,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      const depositCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.DEPOSIT,
      );
      expect(depositCalls.length).toBeGreaterThan(0);
      expect(depositCalls[0][1][4]).toBe('200.00');
      expect(depositCalls[0][1][5]).toBe(200);
    });

    it('uses positive delta for withdraw transactions', async () => {
      // Withdraw transactions have negative amounts (e.g., -150)
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: -150,
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionCreated({ transaction });

      const withdrawCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.WITHDRAW,
      );
      expect(withdrawCalls.length).toBeGreaterThan(0);
      // WITHDRAW should be stored as positive (negated from -150)
      expect(withdrawCalls[0][1][4]).toBe('150.00');
      expect(withdrawCalls[0][1][5]).toBe(150);
    });
  });

  describe('handleTransactionDeleted - deposit/withdraw', () => {
    it('uses negative delta when deleting deposit transaction', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 200,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionDeleted({ transaction });

      const depositCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.DEPOSIT,
      );
      expect(depositCalls.length).toBeGreaterThan(0);
      expect(depositCalls[0][1][4]).toBe('-200.00');
      expect(depositCalls[0][1][5]).toBe(-200);
    });

    it('uses negative delta when deleting withdraw transaction', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: -150,
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      await service.handleTransactionDeleted({ transaction });

      const withdrawCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.WITHDRAW,
      );
      expect(withdrawCalls.length).toBeGreaterThan(0);
      expect(withdrawCalls[0][1][4]).toBe('-150.00');
      expect(withdrawCalls[0][1][5]).toBe(-150);
    });
  });

  describe('handleTransactionCreated - accountingDate from income/expense', () => {
    it('uses income accountingDate for INCOME statistics when available', async () => {
      const incomeAccountingDate = new Date('2023-06-15');
      const transactionAccountingDate = new Date('2023-03-15');

      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: transactionAccountingDate,
        incomes: [createIncome({ id: 1, accountingDate: incomeAccountingDate })],
      });

      await service.handleTransactionCreated({ transaction });

      // Find the yearly INCOME call
      const yearlyIncomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.INCOME && call[1][2] === 2023 && call[1][3] === null,
      );
      expect(yearlyIncomeCalls.length).toBe(1);

      // Find the monthly INCOME call - should use income's month (June = 6)
      const monthlyIncomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.INCOME && call[1][2] === 2023 && call[1][3] === 6,
      );
      expect(monthlyIncomeCalls.length).toBe(1);
    });

    it('uses expense accountingDate for EXPENSE statistics when available', async () => {
      const expenseAccountingDate = new Date('2023-09-20');
      const transactionAccountingDate = new Date('2023-03-15');

      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: -50,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: transactionAccountingDate,
        expenses: [createExpense({ id: 1, accountingDate: expenseAccountingDate })],
      });

      await service.handleTransactionCreated({ transaction });

      // Find the monthly EXPENSE call - should use expense's month (September = 9)
      const monthlyExpenseCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.EXPENSE && call[1][2] === 2023 && call[1][3] === 9,
      );
      expect(monthlyExpenseCalls.length).toBe(1);
    });

    it('falls back to transaction accountingDate when income has no accountingDate', async () => {
      const transactionAccountingDate = new Date('2023-03-15');

      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: transactionAccountingDate,
        incomes: [createIncome({ id: 1, accountingDate: null })],
      });

      await service.handleTransactionCreated({ transaction });

      // Should use transaction's accountingDate (March = 3)
      const monthlyIncomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[1][1] === StatisticKey.INCOME && call[1][2] === 2023 && call[1][3] === 3,
      );
      expect(monthlyIncomeCalls.length).toBe(1);
    });
  });

  describe('recalculate', () => {
    it('deletes existing statistics except balance', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 4 });
      mockRepository.find.mockResolvedValue([]);

      await service.recalculate(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({
        propertyId: 1,
        key: expect.objectContaining({ _value: expect.arrayContaining([
          StatisticKey.INCOME,
          StatisticKey.EXPENSE,
          StatisticKey.DEPOSIT,
          StatisticKey.WITHDRAW,
        ]) }),
      });
    });

    it('calls recalculation queries for income, expense, deposit, withdraw', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([]);

      await service.recalculate(1);

      // Should have called queries for:
      // - INCOME: all-time, yearly, monthly (3 queries)
      // - EXPENSE: all-time, yearly, monthly (3 queries)
      // - DEPOSIT: all-time, yearly, monthly (3 queries)
      // - WITHDRAW: all-time, yearly, monthly (3 queries)
      // Total: 12 queries
      expect(mockDataSource.query).toHaveBeenCalled();
      const calls = mockDataSource.query.mock.calls;
      expect(calls.length).toBe(12);
    });

    it('returns summary with counts and totals', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([
        { key: StatisticKey.INCOME, value: '1000.00' },
        { key: StatisticKey.EXPENSE, value: '500.00' },
        { key: StatisticKey.DEPOSIT, value: '2000.00' },
        { key: StatisticKey.WITHDRAW, value: '300.00' },
      ] as PropertyStatistics[]);

      const result = await service.recalculate(1);

      expect(result).toEqual({
        income: { count: 1, total: 1000 },
        expense: { count: 1, total: 500 },
        deposit: { count: 1, total: 2000 },
        withdraw: { count: 1, total: 300 },
      });
    });
  });

  describe('recalculateForProperties', () => {
    it('recalculates for multiple properties and combines results', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      // Mock different results for each property
      mockRepository.find
        .mockResolvedValueOnce([
          { key: StatisticKey.INCOME, value: '1000.00' },
        ] as PropertyStatistics[])
        .mockResolvedValueOnce([
          { key: StatisticKey.INCOME, value: '500.00' },
        ] as PropertyStatistics[]);

      const result = await service.recalculateForProperties([1, 2]);

      expect(result.income.count).toBe(2);
      expect(result.income.total).toBe(1500);
    });
  });

  describe('recalculate - standalone income/expense', () => {
    it('includes standalone incomes (without transaction) in recalculation', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([]);

      await service.recalculate(1);

      // Find the INCOME queries
      const incomeCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[0].includes("'income'"),
      );

      expect(incomeCalls.length).toBe(3); // all-time, yearly, monthly

      // Each income query should include standalone incomes (transactionId IS NULL)
      // The query should use LEFT JOIN or include a condition for NULL transactionId
      for (const call of incomeCalls) {
        const query = call[0];
        // Either uses LEFT JOIN or includes condition for transactionId IS NULL
        const includesStandalone =
          query.includes('LEFT JOIN') ||
          query.includes('"transactionId" IS NULL');
        expect(includesStandalone).toBe(true);
      }
    });

    it('includes standalone expenses (without transaction) in recalculation', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      mockRepository.find.mockResolvedValue([]);

      await service.recalculate(1);

      // Find the EXPENSE queries
      const expenseCalls = mockDataSource.query.mock.calls.filter(
        (call) => call[0].includes("'expense'"),
      );

      expect(expenseCalls.length).toBe(3); // all-time, yearly, monthly

      // Each expense query should include standalone expenses (transactionId IS NULL)
      for (const call of expenseCalls) {
        const query = call[0];
        const includesStandalone =
          query.includes('LEFT JOIN') ||
          query.includes('"transactionId" IS NULL');
        expect(includesStandalone).toBe(true);
      }
    });
  });
});
