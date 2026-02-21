import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { createIncome, createJWTUser, createTransaction } from 'test/factories';
import { TransactionStatus } from '@alisa-backend/common/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '@alisa-backend/common/events';

describe('IncomeService', () => {
  let service: IncomeService;
  let mockRepository: MockRepository<Income>;
  let mockPropertyRepository: MockRepository<Property>;
  let mockIncomeTypeRepository: MockRepository<IncomeType>;
  let mockTransactionRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;
  let mockEventEmitter: { emit: jest.Mock };

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
    mockEventEmitter = { emit: jest.fn() };

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
        { provide: EventEmitter2, useValue: mockEventEmitter },
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

    it('emits event when accountingDate changes and transaction is accepted', async () => {
      const acceptedTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.ACCEPTED,
      });
      const existingIncome = createIncome({
        id: 1,
        propertyId: 1,
        incomeTypeId: 1,
        transactionId: 1,
      });
      existingIncome.accountingDate = new Date('2023-06-15');
      existingIncome.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(existingIncome);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingIncome);

      await service.update(testUser, 1, {
        description: 'Test income',
        accountingDate: new Date('2023-07-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        Events.Income.AccountingDateChanged,
        expect.objectContaining({
          income: expect.objectContaining({ id: 1 }),
          oldAccountingDate: new Date('2023-06-15'),
        }),
      );
    });

    it('does not emit event when accountingDate does not change', async () => {
      const acceptedTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.ACCEPTED,
      });
      const existingIncome = createIncome({
        id: 1,
        propertyId: 1,
        incomeTypeId: 1,
        transactionId: 1,
      });
      existingIncome.accountingDate = new Date('2023-06-15');
      existingIncome.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(existingIncome);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingIncome);

      await service.update(testUser, 1, {
        description: 'Test income',
        accountingDate: new Date('2023-06-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does not emit event when income has no transaction', async () => {
      const existingIncome = createIncome({
        id: 1,
        propertyId: 1,
        incomeTypeId: 1,
        transactionId: null,
      });
      existingIncome.accountingDate = new Date('2023-06-15');
      existingIncome.transaction = null;

      mockRepository.findOne.mockResolvedValue(existingIncome);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingIncome);

      await service.update(testUser, 1, {
        description: 'Test income',
        accountingDate: new Date('2023-07-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes income without transaction', async () => {
      const income = createIncome({ id: 1, propertyId: 1, transactionId: null });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockTransactionRepository.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when income has a transaction relation', async () => {
      const income = createIncome({ id: 1, propertyId: 1, transactionId: 100 });
      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.delete(testUser, 1)).rejects.toThrow(BadRequestException);

      expect(mockRepository.delete).not.toHaveBeenCalled();
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

    it('excludes incomes with pending transaction from search results', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const acceptedTransaction = createTransaction({
        id: 2,
        status: TransactionStatus.ACCEPTED,
      });

      const incomeWithPendingTransaction = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      incomeWithPendingTransaction.transaction = pendingTransaction;

      const incomeWithAcceptedTransaction = createIncome({
        id: 2,
        propertyId: 1,
        transactionId: 2,
      });
      incomeWithAcceptedTransaction.transaction = acceptedTransaction;

      const incomeWithoutTransaction = createIncome({
        id: 3,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.find.mockResolvedValue([
        incomeWithPendingTransaction,
        incomeWithAcceptedTransaction,
        incomeWithoutTransaction,
      ]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {
        relations: ['transaction'],
      });

      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id)).toEqual([2, 3]);
    });

    it('excludes incomes with pending transaction when relations is object format', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const acceptedTransaction = createTransaction({
        id: 2,
        status: TransactionStatus.ACCEPTED,
      });

      const incomeWithPendingTransaction = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      incomeWithPendingTransaction.transaction = pendingTransaction;

      const incomeWithAcceptedTransaction = createIncome({
        id: 2,
        propertyId: 1,
        transactionId: 2,
      });
      incomeWithAcceptedTransaction.transaction = acceptedTransaction;

      mockRepository.find.mockResolvedValue([
        incomeWithPendingTransaction,
        incomeWithAcceptedTransaction,
      ]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      // Frontend uses object format for relations
      const result = await service.search(testUser, {
        relations: { incomeType: true, property: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('includes incomes without transaction in search results', async () => {
      const incomeWithoutTransaction = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.find.mockResolvedValue([incomeWithoutTransaction]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('findOne with transaction status', () => {
    it('returns null when income has pending transaction', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const income = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      income.transaction = pendingTransaction;

      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1, {
        relations: ['transaction'],
      });

      expect(result).toBeNull();
    });

    it('returns income when transaction is accepted', async () => {
      const acceptedTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.ACCEPTED,
      });
      const income = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      income.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1, {
        relations: ['transaction'],
      });

      expect(result).toEqual(income);
    });

    it('returns income when it has no transaction', async () => {
      const income = createIncome({
        id: 1,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.findOne.mockResolvedValue(income);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(income);
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple incomes and returns success result', async () => {
      const income1 = createIncome({ id: 1, propertyId: 1, transactionId: null });
      const income2 = createIncome({ id: 2, propertyId: 1, transactionId: null });

      mockRepository.find.mockResolvedValue([income1, income2]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(true);
      expect(result.rows.total).toBe(2);
      expect(result.rows.success).toBe(2);
      expect(result.rows.failed).toBe(0);
      expect(mockRepository.delete).toHaveBeenCalledTimes(2);
    });

    it('returns 400 for incomes with transaction relations', async () => {
      const income1 = createIncome({ id: 1, propertyId: 1, transactionId: 100 });
      const income2 = createIncome({ id: 2, propertyId: 1, transactionId: 101 });

      mockRepository.find.mockResolvedValue([income1, income2]);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(false);
      expect(result.rows.success).toBe(0);
      expect(result.rows.failed).toBe(2);
      expect(result.results[0].statusCode).toBe(400);
      expect(result.results[0].message).toContain('transaction');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when ids array is empty', async () => {
      const { BadRequestException } = await import('@nestjs/common');

      await expect(service.deleteMany(testUser, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns unauthorized result for incomes user does not own', async () => {
      const income1 = createIncome({ id: 1, propertyId: 1, transactionId: null });
      const income2 = createIncome({ id: 2, propertyId: 3, transactionId: null });

      mockRepository.find.mockResolvedValue([income1, income2]);
      mockAuthService.hasOwnership
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(false);
      expect(result.rows.success).toBe(1);
      expect(result.rows.failed).toBe(1);
      expect(result.results.find((r) => r.id === 2)?.statusCode).toBe(401);
    });

    it('returns partial success when some deletions fail', async () => {
      const income1 = createIncome({ id: 1, propertyId: 1, transactionId: null });
      const income2 = createIncome({ id: 2, propertyId: 1, transactionId: null });

      mockRepository.find.mockResolvedValue([income1, income2]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete
        .mockResolvedValueOnce({ affected: 1 })
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(false);
      expect(result.rows.success).toBe(1);
      expect(result.rows.failed).toBe(1);
    });

    it('handles non-existent income ids gracefully', async () => {
      const income1 = createIncome({ id: 1, propertyId: 1, transactionId: null });

      // Only income1 exists, income2 (id: 2) does not exist
      mockRepository.find.mockResolvedValue([income1]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMany(testUser, [1, 2]);

      // Only the existing income is processed
      expect(result.rows.total).toBe(1);
      expect(result.rows.success).toBe(1);
    });
  });
});
