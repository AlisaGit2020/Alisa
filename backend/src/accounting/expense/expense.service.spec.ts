import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { Expense } from './entities/expense.entity';
import { ExpenseType } from './entities/expense-type.entity';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { DepreciationService } from '@alisa-backend/accounting/depreciation/depreciation.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import { createExpense, createJWTUser, createTransaction } from 'test/factories';
import { TransactionStatus } from '@alisa-backend/common/types';

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

    it('deletes expense and associated transaction', async () => {
      const expense = createExpense({ id: 1, propertyId: 1, transactionId: 100 });
      mockRepository.findOne.mockResolvedValue(expense);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockTransactionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockDepreciationService.deleteByExpenseId).toHaveBeenCalledWith(1);
      expect(mockTransactionRepository.delete).toHaveBeenCalledWith(100);
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
});
