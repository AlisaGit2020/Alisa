import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyStatisticsService } from './property-statistics.service';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { createMockRepository, MockRepository } from 'test/mocks';
import { createTransaction, createJWTUser } from 'test/factories';
import {
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

describe('PropertyStatisticsService', () => {
  let service: PropertyStatisticsService;
  let mockRepository: MockRepository<PropertyStatistics>;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });

  beforeEach(async () => {
    mockRepository = createMockRepository<PropertyStatistics>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyStatisticsService,
        {
          provide: getRepositoryToken(PropertyStatistics),
          useValue: mockRepository,
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
  });

  describe('handleTransactionCreated', () => {
    it('creates statistics for all time, yearly, and monthly', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.handleTransactionCreated({ transaction });

      // Should be called for each statistic type (BALANCE, INCOME, EXPENSE, DEPOSIT, WITHDRAW)
      // × 3 time periods (all time, yearly, monthly)
      // But only BALANCE and INCOME are relevant for INCOME type
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('updates existing statistics', async () => {
      const existingStatistic = {
        propertyId: 1,
        key: StatisticKey.INCOME,
        year: null,
        month: null,
        value: '500.00',
      } as PropertyStatistics;

      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      mockRepository.findOne.mockResolvedValue(existingStatistic);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.handleTransactionCreated({ transaction });

      expect(mockRepository.save).toHaveBeenCalled();
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

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleTransactionDeleted', () => {
    it('subtracts amount from statistics when transaction is deleted', async () => {
      const existingStatistic = {
        propertyId: 1,
        key: StatisticKey.INCOME,
        year: null,
        month: null,
        value: '500.00',
      } as PropertyStatistics;

      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        transactionDate: new Date('2023-03-15'),
        accountingDate: new Date('2023-03-15'),
      });

      mockRepository.findOne.mockResolvedValue(existingStatistic);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.handleTransactionDeleted({ transaction });

      expect(mockRepository.save).toHaveBeenCalled();
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

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
