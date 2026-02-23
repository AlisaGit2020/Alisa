import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { ExpenseType } from './entities/expense-type.entity';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { DepreciationService } from '@asset-backend/accounting/depreciation/depreciation.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createExpense, createJWTUser, createTransaction } from 'test/factories';
import { TransactionStatus } from '@asset-backend/common/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '@asset-backend/common/events';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let mockRepository: MockRepository<Expense>;
  let mockExpenseTypeRepository: MockRepository<ExpenseType>;
  let mockTransactionRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;
  let mockDepreciationService: {
    createFromExpense: jest.Mock;
    deleteByExpenseId: jest.Mock;
    getByExpenseId: jest.Mock;
    updateFromExpense: jest.Mock;
  };
  let mockEventEmitter: { emit: jest.Mock };

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [3, 4] });
  const userWithoutProperties = createJWTUser({
    id: 3,
    ownershipInProperties: [],
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Expense>();
    mockExpenseTypeRepository = createMockRepository<ExpenseType>();
    mockTransactionRepository = createMockRepository<Transaction>();
    mockAuthService = createMockAuthService();
    mockDepreciationService = {
      createFromExpense: jest.fn(),
      deleteByExpenseId: jest.fn(),
      getByExpenseId: jest.fn().mockResolvedValue(null),
      updateFromExpense: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: getRepositoryToken(Expense), useValue: mockRepository },
        {
          provide: getRepositoryToken(ExpenseType),
          useValue: mockExpenseTypeRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        { provide: AuthService, useValue: mockAuthService },
        { provide: DepreciationService, useValue: mockDepreciationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  describe('findOne', () => {
    it('returns expense when user has ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(expense);
    });

    it('returns null when expense does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates expense when user has ownership', async () => {
      const input = {
        propertyId: 1,
        expenseTypeId: 1,
        description: 'Test expense',
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      };
      const savedExpense = createExpense({ id: 1, ...input });

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(savedExpense);
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedExpense);
    });

    it('throws UnauthorizedException when user has no property access', async () => {
      const input = {
        propertyId: 1,
        expenseTypeId: 1,
        description: 'Test expense',
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
    it('updates expense', async () => {
      const existingExpense = createExpense({ id: 1, propertyId: 1, expenseTypeId: 1 });
      const input = {
        description: 'Updated expense',
        amount: 200,
        quantity: 1,
        totalAmount: 200,
      };

      mockRepository.findOne.mockResolvedValue(existingExpense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingExpense, ...input });
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      const result = await service.update(testUser, 1, input);

      expect(result.description).toBe('Updated expense');
    });

    it('throws NotFoundException when expense does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, { description: 'Test', amount: 100, quantity: 1, totalAmount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
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
      const existingExpense = createExpense({
        id: 1,
        propertyId: 1,
        expenseTypeId: 1,
        transactionId: 1,
      });
      existingExpense.accountingDate = new Date('2023-06-15');
      existingExpense.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(existingExpense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingExpense);
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      await service.update(testUser, 1, {
        description: 'Test expense',
        accountingDate: new Date('2023-07-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        Events.Expense.AccountingDateChanged,
        expect.objectContaining({
          expense: expect.objectContaining({ id: 1 }),
          oldAccountingDate: new Date('2023-06-15'),
        }),
      );
    });

    it('does not emit event when accountingDate does not change', async () => {
      const acceptedTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.ACCEPTED,
      });
      const existingExpense = createExpense({
        id: 1,
        propertyId: 1,
        expenseTypeId: 1,
        transactionId: 1,
      });
      existingExpense.accountingDate = new Date('2023-06-15');
      existingExpense.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(existingExpense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingExpense);
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      await service.update(testUser, 1, {
        description: 'Test expense',
        accountingDate: new Date('2023-06-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('emits StandaloneUpdated event when expense has no transaction', async () => {
      const existingExpense = createExpense({
        id: 1,
        propertyId: 1,
        expenseTypeId: 1,
        transactionId: null,
      });
      existingExpense.accountingDate = new Date('2023-06-15');
      existingExpense.transaction = null;

      mockRepository.findOne.mockResolvedValue(existingExpense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(existingExpense);
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      await service.update(testUser, 1, {
        description: 'Test expense',
        accountingDate: new Date('2023-07-15'),
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'expense.standaloneUpdated',
        expect.objectContaining({ expense: expect.any(Object) }),
      );
    });

    it('emits StandaloneUpdated event with old values for delta calculation', async () => {
      const existingExpense = createExpense({
        id: 1,
        propertyId: 1,
        expenseTypeId: 1,
        transactionId: null,
        totalAmount: 100,
      });
      existingExpense.accountingDate = new Date('2023-06-15');
      existingExpense.transaction = null;

      mockRepository.findOne.mockResolvedValue(existingExpense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({
        ...existingExpense,
        totalAmount: 200,
        accountingDate: new Date('2023-07-15'),
      });
      mockExpenseTypeRepository.findOne.mockResolvedValue({ id: 1, isCapitalImprovement: false });

      await service.update(testUser, 1, {
        description: 'Test expense',
        accountingDate: new Date('2023-07-15'),
        amount: 200,
        quantity: 1,
        totalAmount: 200,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        Events.Expense.StandaloneUpdated,
        expect.objectContaining({
          expense: expect.any(Object),
          oldTotalAmount: 100,
          oldAccountingDate: new Date('2023-06-15'),
        }),
      );
    });
  });

  describe('delete', () => {
    it('deletes expense without transaction', async () => {
      const expense = createExpense({ id: 1, propertyId: 1, transactionId: null });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockDepreciationService.deleteByExpenseId).toHaveBeenCalledWith(1);
      expect(mockTransactionRepository.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when expense has a transaction relation', async () => {
      const expense = createExpense({ id: 1, propertyId: 1, transactionId: 100 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.delete(testUser, 1)).rejects.toThrow(BadRequestException);

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when expense does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const expense = createExpense({ id: 1, propertyId: 1 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.delete(userWithoutProperties, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('emits StandaloneDeleted event with deleted expense data', async () => {
      const expense = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: null,
        totalAmount: 150,
        accountingDate: new Date('2023-06-15'),
        expenseTypeId: 5,
      });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        Events.Expense.StandaloneDeleted,
        expect.objectContaining({
          expense: expect.objectContaining({
            id: 1,
            totalAmount: 150,
            accountingDate: new Date('2023-06-15'),
            expenseTypeId: 5,
          }),
        }),
      );
    });
  });

  describe('search', () => {
    it('returns expenses with ownership filter applied', async () => {
      const expenses = [
        createExpense({ id: 1, propertyId: 1 }),
        createExpense({ id: 2, propertyId: 1 }),
      ];
      mockRepository.find.mockResolvedValue(expenses);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {});

      expect(result).toEqual(expenses);
      expect(mockAuthService.addOwnershipFilter).toHaveBeenCalled();
    });

    it('returns empty array for user without expenses', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(userWithoutProperties, {});

      expect(result).toEqual([]);
    });

    it('excludes expenses with pending transaction from search results', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const acceptedTransaction = createTransaction({
        id: 2,
        status: TransactionStatus.ACCEPTED,
      });

      const expenseWithPendingTransaction = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      expenseWithPendingTransaction.transaction = pendingTransaction;

      const expenseWithAcceptedTransaction = createExpense({
        id: 2,
        propertyId: 1,
        transactionId: 2,
      });
      expenseWithAcceptedTransaction.transaction = acceptedTransaction;

      const expenseWithoutTransaction = createExpense({
        id: 3,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.find.mockResolvedValue([
        expenseWithPendingTransaction,
        expenseWithAcceptedTransaction,
        expenseWithoutTransaction,
      ]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {
        relations: ['transaction'],
      });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual([2, 3]);
    });

    it('excludes expenses with pending transaction when relations is object format', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const acceptedTransaction = createTransaction({
        id: 2,
        status: TransactionStatus.ACCEPTED,
      });

      const expenseWithPendingTransaction = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      expenseWithPendingTransaction.transaction = pendingTransaction;

      const expenseWithAcceptedTransaction = createExpense({
        id: 2,
        propertyId: 1,
        transactionId: 2,
      });
      expenseWithAcceptedTransaction.transaction = acceptedTransaction;

      mockRepository.find.mockResolvedValue([
        expenseWithPendingTransaction,
        expenseWithAcceptedTransaction,
      ]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      // Frontend uses object format for relations
      const result = await service.search(testUser, {
        relations: { expenseType: true, property: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('includes expenses without transaction in search results', async () => {
      const expenseWithoutTransaction = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.find.mockResolvedValue([expenseWithoutTransaction]);
      mockAuthService.addOwnershipFilter.mockImplementation(
        (_user, where) => where,
      );

      const result = await service.search(testUser, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('findOne with transaction status', () => {
    it('returns null when expense has pending transaction', async () => {
      const pendingTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.PENDING,
      });
      const expense = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      expense.transaction = pendingTransaction;

      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1, {
        relations: ['transaction'],
      });

      expect(result).toBeNull();
    });

    it('returns expense when transaction is accepted', async () => {
      const acceptedTransaction = createTransaction({
        id: 1,
        status: TransactionStatus.ACCEPTED,
      });
      const expense = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: 1,
      });
      expense.transaction = acceptedTransaction;

      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1, {
        relations: ['transaction'],
      });

      expect(result).toEqual(expense);
    });

    it('returns expense when it has no transaction', async () => {
      const expense = createExpense({
        id: 1,
        propertyId: 1,
        transactionId: null,
      });

      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(expense);
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple expenses and returns success result', async () => {
      const expense1 = createExpense({ id: 1, propertyId: 1, transactionId: null });
      const expense2 = createExpense({ id: 2, propertyId: 1, transactionId: null });

      mockRepository.find.mockResolvedValue([expense1, expense2]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(true);
      expect(result.rows.total).toBe(2);
      expect(result.rows.success).toBe(2);
      expect(result.rows.failed).toBe(0);
      expect(mockRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockDepreciationService.deleteByExpenseId).toHaveBeenCalledTimes(2);
    });

    it('returns 400 for expenses with transaction relations', async () => {
      const expense1 = createExpense({ id: 1, propertyId: 1, transactionId: 100 });
      const expense2 = createExpense({ id: 2, propertyId: 1, transactionId: 101 });

      mockRepository.find.mockResolvedValue([expense1, expense2]);
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

    it('returns unauthorized result for expenses user does not own', async () => {
      const expense1 = createExpense({ id: 1, propertyId: 1, transactionId: null });
      const expense2 = createExpense({ id: 2, propertyId: 3, transactionId: null });

      mockRepository.find.mockResolvedValue([expense1, expense2]);
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
      const expense1 = createExpense({ id: 1, propertyId: 1, transactionId: null });
      const expense2 = createExpense({ id: 2, propertyId: 1, transactionId: null });

      mockRepository.find.mockResolvedValue([expense1, expense2]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete
        .mockResolvedValueOnce({ affected: 1 })
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.deleteMany(testUser, [1, 2]);

      expect(result.allSuccess).toBe(false);
      expect(result.rows.success).toBe(1);
      expect(result.rows.failed).toBe(1);
    });

    it('handles non-existent expense ids gracefully', async () => {
      const expense1 = createExpense({ id: 1, propertyId: 1, transactionId: null });

      // Only expense1 exists, expense2 (id: 2) does not exist
      mockRepository.find.mockResolvedValue([expense1]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMany(testUser, [1, 2]);

      // Only the existing expense is processed
      expect(result.rows.total).toBe(1);
      expect(result.rows.success).toBe(1);
    });
  });
});
