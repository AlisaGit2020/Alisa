import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';
import { AirbnbStatisticsService } from './airbnb-statistics.service';
import {
  StandaloneIncomeCreatedEvent,
  StandaloneIncomeDeletedEvent,
  StandaloneIncomeUpdatedEvent,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
  UserAirbnbIncomeTypeChangedEvent,
} from '@alisa-backend/common/events';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { StatisticKey, TransactionStatus, TransactionType } from '@alisa-backend/common/types';

describe('AirbnbStatisticsService', () => {
  let service: AirbnbStatisticsService;
  let mockDataSource: { query: jest.Mock };
  let mockEventTracker: { increment: jest.Mock; decrement: jest.Mock };

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    mockEventTracker = {
      increment: jest.fn(),
      decrement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AirbnbStatisticsService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventTrackerService, useValue: mockEventTracker },
      ],
    }).compile();

    service = module.get<AirbnbStatisticsService>(AirbnbStatisticsService);
  });

  describe('recalculateAirbnbVisits', () => {
    it('executes delete and insert queries for property', async () => {
      await service.recalculateAirbnbVisits(1);

      // Should call query 4 times: delete + all-time + yearly + monthly
      expect(mockDataSource.query).toHaveBeenCalledTimes(4);

      // First call should be delete with propertyId and statisticKey parameters
      expect(mockDataSource.query.mock.calls[0][0]).toContain('DELETE');
      expect(mockDataSource.query.mock.calls[0][1]).toEqual([
        1,
        StatisticKey.AIRBNB_VISITS,
      ]);

      // Second call should be all-time insert (year IS NULL, month IS NULL)
      expect(mockDataSource.query.mock.calls[1][0]).toContain('INSERT');
      expect(mockDataSource.query.mock.calls[1][0]).toContain('NULL');

      // Third call should be yearly insert
      expect(mockDataSource.query.mock.calls[2][0]).toContain('EXTRACT(YEAR');

      // Fourth call should be monthly insert
      expect(mockDataSource.query.mock.calls[3][0]).toContain('EXTRACT(MONTH');
    });

    it('joins to user table to filter by airbnbIncomeTypeId', async () => {
      await service.recalculateAirbnbVisits(1);

      // All insert queries should reference user and airbnbIncomeTypeId
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[0]).toContain('"user"');
        expect(call[0]).toContain('"airbnbIncomeTypeId"');
      }
    });

    it('counts distinct incomes to avoid duplicate counting with multiple owners', async () => {
      await service.recalculateAirbnbVisits(1);

      // All insert queries should use COUNT(DISTINCT i.id) to handle multi-owner properties
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[0]).toContain('COUNT(DISTINCT i.id)');
        expect(call[0]).not.toContain('SUM');
      }
    });

    it('filters standalone and accepted transaction-linked incomes', async () => {
      await service.recalculateAirbnbVisits(1);

      // Insert queries should filter by transactionId IS NULL OR status = ACCEPTED
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[0]).toContain('i."transactionId" IS NULL OR t.status =');
      }
    });
  });

  describe('handleStandaloneIncomeCreated', () => {
    it('triggers recalculation when income is created', async () => {
      const income = { propertyId: 1, incomeTypeId: 5 } as Income;
      const event = new StandaloneIncomeCreatedEvent(income);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleStandaloneIncomeCreated(event);

      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(1);
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });
  });

  describe('handleStandaloneIncomeUpdated', () => {
    it('triggers recalculation when income is updated', async () => {
      const income = { propertyId: 2, incomeTypeId: 5 } as Income;
      const event = new StandaloneIncomeUpdatedEvent(income);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleStandaloneIncomeUpdated(event);

      expect(spy).toHaveBeenCalledWith(2);
    });
  });

  describe('handleStandaloneIncomeDeleted', () => {
    it('triggers recalculation when income is deleted', async () => {
      const event = new StandaloneIncomeDeletedEvent(3);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleStandaloneIncomeDeleted(event);

      expect(spy).toHaveBeenCalledWith(3);
    });
  });

  describe('handleTransactionAccepted', () => {
    it('triggers recalculation for INCOME type transactions', async () => {
      const transaction = {
        propertyId: 1,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
      } as Transaction;
      const event = new TransactionCreatedEvent(transaction);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleTransactionAccepted(event);

      expect(spy).toHaveBeenCalledWith(1);
    });

    it('does not trigger recalculation for non-INCOME type transactions', async () => {
      const transaction = {
        propertyId: 1,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.ACCEPTED,
      } as Transaction;
      const event = new TransactionCreatedEvent(transaction);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleTransactionAccepted(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('handleTransactionDeleted', () => {
    it('triggers recalculation for INCOME type transactions', async () => {
      const transaction = {
        propertyId: 1,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
      } as Transaction;
      const event = new TransactionDeletedEvent(transaction);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleTransactionDeleted(event);

      expect(spy).toHaveBeenCalledWith(1);
    });

    it('does not trigger recalculation for non-INCOME type transactions', async () => {
      const transaction = {
        propertyId: 1,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.ACCEPTED,
      } as Transaction;
      const event = new TransactionDeletedEvent(transaction);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleTransactionDeleted(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('handleAirbnbIncomeTypeChanged', () => {
    it('triggers recalculation for all user properties', async () => {
      const event = new UserAirbnbIncomeTypeChangedEvent(1, [1, 2, 3]);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleAirbnbIncomeTypeChanged(event);

      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(1);
      expect(spy).toHaveBeenCalledWith(2);
      expect(spy).toHaveBeenCalledWith(3);
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });

    it('handles empty property list', async () => {
      const event = new UserAirbnbIncomeTypeChangedEvent(1, []);

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleAirbnbIncomeTypeChanged(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
