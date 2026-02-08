import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { Transaction } from './entities/transaction.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createMockRepository,
  createMockAuthService,
  createMockEventEmitter,
  MockRepository,
  MockAuthService,
  MockEventEmitter,
} from 'test/mocks';
import { createTransaction, createProperty, createJWTUser } from 'test/factories';
import { TransactionStatus } from '@alisa-backend/common/types';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let mockRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;
  let mockPropertyService: Partial<Record<keyof PropertyService, jest.Mock>>;
  let mockEventEmitter: MockEventEmitter;
  let mockEventTracker: { increment: jest.Mock; decrement: jest.Mock };

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const userWithoutProperties = createJWTUser({
    id: 2,
    ownershipInProperties: [],
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Transaction>();
    mockAuthService = createMockAuthService();
    mockPropertyService = {
      findOne: jest.fn(),
    };
    mockEventEmitter = createMockEventEmitter();
    mockEventTracker = {
      increment: jest.fn(),
      decrement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: EventTrackerService, useValue: mockEventTracker },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  describe('getBalance', () => {
    it('returns balance for property with transactions', async () => {
      const property = createProperty({ id: 1 });
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        balance: 500,
        status: TransactionStatus.ACCEPTED,
      });

      mockPropertyService.findOne.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.find.mockResolvedValue([transaction]);

      const result = await service.getBalance(testUser, 1);

      expect(result).toBe(500);
    });

    it('returns zero when no transactions exist', async () => {
      const property = createProperty({ id: 1 });

      mockPropertyService.findOne.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getBalance(testUser, 1);

      expect(result).toBe(0);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPropertyService.findOne.mockResolvedValue(null);

      await expect(service.getBalance(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const property = createProperty({ id: 1 });

      mockPropertyService.findOne.mockResolvedValue(property);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.getBalance(userWithoutProperties, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('transactionAccepted', () => {
    it('updates balance when transaction is accepted', async () => {
      const transaction = createTransaction({
        id: 2,
        propertyId: 1,
        amount: 100,
        status: TransactionStatus.ACCEPTED,
      });
      const previousTransaction = createTransaction({
        id: 1,
        propertyId: 1,
        balance: 500,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.find.mockResolvedValue([previousTransaction]);
      mockRepository.findOne.mockResolvedValue(previousTransaction);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.transactionAccepted({ transaction });

      expect(transaction.balance).toBe(600);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('sets balance equal to amount when first transaction', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.find.mockResolvedValue([]);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.transactionAccepted({ transaction });

      expect(transaction.balance).toBe(100);
    });
  });

  describe('handleTransactionDelete', () => {
    it('recalculates balances after deletion', async () => {
      const deletedTransaction = createTransaction({
        id: 2,
        propertyId: 1,
        amount: 100,
        balance: 600,
        status: TransactionStatus.ACCEPTED,
      });
      const nextTransaction = createTransaction({
        id: 3,
        propertyId: 1,
        amount: 50,
        balance: 650,
        status: TransactionStatus.ACCEPTED,
      });

      // First call for next transactions
      mockRepository.find
        .mockResolvedValueOnce([nextTransaction]) // find next transaction
        .mockResolvedValueOnce([]); // find transactions after next

      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.handleTransactionDelete({ transaction: deletedTransaction });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('emits event when last transaction is deleted', async () => {
      const deletedTransaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        balance: 100,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.find.mockResolvedValue([]);

      await service.handleTransactionDelete({ transaction: deletedTransaction });

      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('recalculateBalancesAfter', () => {
    it('returns current balance when no transactions after', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        balance: 500,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.find.mockResolvedValue([]);

      const result = await service.recalculateBalancesAfter(transaction);

      expect(result).toBe(500);
    });

    it('recalculates all subsequent balances', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        amount: 100,
        balance: 100,
        status: TransactionStatus.ACCEPTED,
      });
      const transaction2 = createTransaction({
        id: 2,
        propertyId: 1,
        amount: 50,
        balance: 150,
        status: TransactionStatus.ACCEPTED,
      });
      const transaction3 = createTransaction({
        id: 3,
        propertyId: 1,
        amount: -30,
        balance: 120,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.find.mockResolvedValue([transaction2, transaction3]);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.recalculateBalancesAfter(transaction);

      expect(result).toBe(120);
    });
  });
});
