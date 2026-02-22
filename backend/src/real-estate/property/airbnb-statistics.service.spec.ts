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
} from '@alisa-backend/common/events';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  StatisticKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

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

    it('joins to income_type table to filter by airbnb key', async () => {
      await service.recalculateAirbnbVisits(1);

      // All insert queries should reference income_type and key
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[0]).toContain('income_type');
        expect(call[0]).toContain('it.key');
      }
    });

    it('counts incomes matching airbnb income type key', async () => {
      await service.recalculateAirbnbVisits(1);

      // All insert queries should use COUNT
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[0]).toContain('COUNT');
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

    it('uses airbnb key constant in query parameters', async () => {
      await service.recalculateAirbnbVisits(1);

      // All insert queries should have 'airbnb' as a parameter
      const insertCalls = mockDataSource.query.mock.calls.slice(1);
      for (const call of insertCalls) {
        expect(call[1]).toContain('airbnb');
      }
    });
  });

  describe('handleStandaloneIncomeCreated', () => {
    it('uses incremental update for airbnb income', async () => {
      const income = {
        propertyId: 1,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'airbnb' },
      } as unknown as Income;
      const event = new StandaloneIncomeCreatedEvent(income);

      await service.handleStandaloneIncomeCreated(event);

      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(mockDataSource.query).toHaveBeenCalled();
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });

    it('skips update for non-airbnb income', async () => {
      const income = {
        propertyId: 1,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'rent' },
      } as unknown as Income;
      const event = new StandaloneIncomeCreatedEvent(income);

      await service.handleStandaloneIncomeCreated(event);

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('handleStandaloneIncomeUpdated', () => {
    it('triggers recalculation when income type might have changed to airbnb', async () => {
      const income = {
        propertyId: 2,
        incomeTypeId: 5,
        incomeType: { key: 'airbnb' },
      } as unknown as Income;
      const event = new StandaloneIncomeUpdatedEvent(
        income,
        100, // oldTotalAmount
        new Date('2023-06-15'), // oldAccountingDate
        5, // oldIncomeTypeId
      );

      const spy = jest.spyOn(service, 'recalculateAirbnbVisits');

      await service.handleStandaloneIncomeUpdated(event);

      expect(spy).toHaveBeenCalledWith(2);
    });
  });

  describe('handleStandaloneIncomeDeleted', () => {
    it('uses incremental update for airbnb income', async () => {
      const income = {
        propertyId: 3,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'airbnb' },
      } as unknown as Income;
      const event = new StandaloneIncomeDeletedEvent(income);

      await service.handleStandaloneIncomeDeleted(event);

      expect(mockEventTracker.increment).toHaveBeenCalled();
      expect(mockDataSource.query).toHaveBeenCalled();
      expect(mockEventTracker.decrement).toHaveBeenCalled();
    });

    it('skips update for non-airbnb income', async () => {
      const income = {
        propertyId: 3,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'rent' },
      } as unknown as Income;
      const event = new StandaloneIncomeDeletedEvent(income);

      await service.handleStandaloneIncomeDeleted(event);

      expect(mockDataSource.query).not.toHaveBeenCalled();
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

  describe('incremental updates', () => {
    it('handleStandaloneIncomeCreated uses incremental +1 count for airbnb income', async () => {
      const income = {
        id: 1,
        propertyId: 1,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'airbnb' },
      } as unknown as Income;
      const event = new StandaloneIncomeCreatedEvent(income);

      await service.handleStandaloneIncomeCreated(event);

      // Should NOT call delete (which is part of full recalculation)
      const queries = mockDataSource.query.mock.calls;
      const hasDelete = queries.some((call) => call[0].includes('DELETE'));
      expect(hasDelete).toBe(false);

      // Should call incremental upsert with +1 delta
      expect(queries.length).toBe(3); // all-time, yearly, monthly
      for (const call of queries) {
        expect(call[0]).toContain('ON CONFLICT');
        // Delta should be 1
        expect(call[1][5]).toBe(1);
      }
    });

    it('handleStandaloneIncomeDeleted uses incremental -1 count for airbnb income', async () => {
      const income = {
        id: 1,
        propertyId: 1,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'airbnb' },
      } as unknown as Income;
      const event = new StandaloneIncomeDeletedEvent(income);

      await service.handleStandaloneIncomeDeleted(event);

      // Should call incremental upsert with -1 delta
      const queries = mockDataSource.query.mock.calls;
      expect(queries.length).toBe(3);
      for (const call of queries) {
        expect(call[0]).toContain('ON CONFLICT');
        // Delta should be -1
        expect(call[1][5]).toBe(-1);
      }
    });

    it('skips incremental update for non-airbnb income type', async () => {
      const income = {
        id: 1,
        propertyId: 1,
        incomeTypeId: 5,
        accountingDate: new Date('2023-06-15'),
        incomeType: { key: 'rent' },
      } as unknown as Income;
      const event = new StandaloneIncomeCreatedEvent(income);

      await service.handleStandaloneIncomeCreated(event);

      // Should not call any queries for non-airbnb income
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });
});
