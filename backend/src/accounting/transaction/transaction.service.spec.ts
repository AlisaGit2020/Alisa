import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createMockRepository,
  createMockAuthService,
  createMockEventEmitter,
  MockRepository,
  MockAuthService,
  MockEventEmitter,
} from 'test/mocks';
import {
  createTransaction,
  createExpenseTransaction,
  createIncomeTransaction,
  createJWTUser,
} from 'test/factories';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;
  let mockEventEmitter: MockEventEmitter;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [] });

  beforeEach(async () => {
    mockRepository = createMockRepository<Transaction>();
    mockAuthService = createMockAuthService();
    mockEventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  describe('findOne', () => {
    it('returns transaction when user has ownership', async () => {
      const transaction = createTransaction({ id: 1, propertyId: 1 });
      mockRepository.findOneBy.mockResolvedValue(transaction);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(transaction);
    });

    it('returns null when transaction does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(testUser, 999);

      expect(result).toBeNull();
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const transaction = createTransaction({ id: 1, propertyId: 1 });
      mockRepository.findOneBy.mockResolvedValue(transaction);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('add', () => {
    it('creates transaction and emits events', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.INCOME,
        status: TransactionStatus.ACCEPTED,
        sender: 'Test Sender',
        receiver: 'Test Receiver',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
      };
      const savedTransaction = createTransaction({ id: 1, ...input });

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(savedTransaction);

      const result = await service.add(testUser, input);

      expect(result).toEqual(savedTransaction);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('converts expense amount to negative', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
        expenses: [
          {
            expenseTypeId: 1,
            description: 'Test expense',
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 1 }),
      );

      const result = await service.add(testUser, input);

      expect(result.amount).toBe(-100);
    });

    it('throws UnauthorizedException for another user property', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.INCOME,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
      };

      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.add(otherUser, input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws BadRequestException when accepted transaction has unknown type', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.UNKNOWN,
        status: TransactionStatus.ACCEPTED,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for expense with incomes', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
        incomes: [
          {
            incomeTypeId: 1,
            description: 'Test',
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for income with expenses', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.INCOME,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
        expenses: [
          {
            expenseTypeId: 1,
            description: 'Test',
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for deposit with incomes', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
        incomes: [
          {
            incomeTypeId: 1,
            description: 'Test',
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for withdraw with expenses', async () => {
      const input = {
        propertyId: 1,
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.PENDING,
        sender: 'Test',
        receiver: 'Test',
        description: 'Test',
        transactionDate: new Date(),
        accountingDate: new Date(),
        amount: 100,
        expenses: [
          {
            expenseTypeId: 1,
            description: 'Test',
            amount: 100,
            quantity: 1,
            totalAmount: 100,
          },
        ],
      };

      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(service.add(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates pending transaction', async () => {
      const existingTransaction = createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.PENDING,
      });
      const input = {
        type: TransactionType.INCOME,
        sender: 'New Sender',
        receiver: 'New Receiver',
        accountingDate: new Date(),
        transactionDate: new Date(),
        amount: 200,
        description: 'Updated',
      };

      mockRepository.findOneBy.mockResolvedValue(existingTransaction);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({ ...existingTransaction, ...input });

      const result = await service.update(testUser, 1, input);

      expect(result.description).toBe('Updated');
    });

    it('throws BadRequestException when updating accepted transaction', async () => {
      const existingTransaction = createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.ACCEPTED,
      });

      mockRepository.findOneBy.mockResolvedValue(existingTransaction);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      await expect(
        service.update(testUser, 1, {
          type: TransactionType.INCOME,
          sender: 'Test',
          receiver: 'Test',
          accountingDate: new Date(),
          transactionDate: new Date(),
          amount: 100,
          description: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(testUser, 999, {
          type: TransactionType.INCOME,
          sender: 'Test',
          receiver: 'Test',
          accountingDate: new Date(),
          transactionDate: new Date(),
          amount: 100,
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException for another user transaction', async () => {
      const transaction = createTransaction({ id: 1, propertyId: 1 });
      mockRepository.findOneBy.mockResolvedValue(transaction);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(
        service.update(otherUser, 1, {
          type: TransactionType.INCOME,
          sender: 'Test',
          receiver: 'Test',
          accountingDate: new Date(),
          transactionDate: new Date(),
          amount: 100,
          description: 'Test',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('deletes transaction and emits event', async () => {
      const transaction = createTransaction({ id: 1, propertyId: 1 });
      mockRepository.findOneBy.mockResolvedValue(transaction);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(testUser, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.delete(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException for another user transaction', async () => {
      const transaction = createTransaction({ id: 1, propertyId: 1 });
      mockRepository.findOneBy.mockResolvedValue(transaction);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.delete(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('search', () => {
    it('returns transactions with ownership filter applied', async () => {
      const transactions = [
        createIncomeTransaction({ id: 1, propertyId: 1 }),
        createExpenseTransaction({ id: 2, propertyId: 1 }),
      ];
      mockRepository.find.mockResolvedValue(transactions);
      mockAuthService.addOwnershipFilter.mockImplementation((_user, where) => where);

      const result = await service.search(testUser, {});

      expect(result).toEqual(transactions);
      expect(mockAuthService.addOwnershipFilter).toHaveBeenCalled();
    });

    it('returns empty array for user without transactions', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockAuthService.addOwnershipFilter.mockImplementation((_user, where) => where);

      const result = await service.search(otherUser, {});

      expect(result).toEqual([]);
    });
  });

  describe('accept', () => {
    it('accepts multiple transactions', async () => {
      const transactions = [
        createTransaction({
          id: 1,
          propertyId: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.INCOME,
        }),
        createTransaction({
          id: 2,
          propertyId: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
        }),
      ];

      mockRepository.find.mockResolvedValue(transactions);
      mockRepository.findOneBy.mockImplementation((criteria) =>
        Promise.resolve(transactions.find((t) => t.id === criteria.id)),
      );
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, status: TransactionStatus.ACCEPTED }),
      );

      const result = await service.accept(testUser, [1, 2]);

      expect(result.rows.total).toBe(2);
    });

    it('throws BadRequestException when ids array is empty', async () => {
      await expect(service.accept(testUser, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns 400 for transaction with unknown type', async () => {
      const transaction = createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.PENDING,
        type: TransactionType.UNKNOWN,
      });

      mockRepository.find.mockResolvedValue([transaction]);

      const result = await service.accept(testUser, [1]);

      expect(result.results[0].statusCode).toBe(400);
    });
  });

  describe('setType', () => {
    it('sets type for multiple transactions', async () => {
      const transactions = [
        createTransaction({
          id: 1,
          propertyId: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
        }),
      ];

      mockRepository.find.mockResolvedValue(transactions);
      mockRepository.findOneBy.mockResolvedValue(transactions[0]);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity }),
      );

      const result = await service.setType(testUser, [1], TransactionType.INCOME);

      expect(result.rows.total).toBe(1);
    });

    it('throws BadRequestException when ids array is empty', async () => {
      await expect(
        service.setType(testUser, [], TransactionType.INCOME),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid type', async () => {
      await expect(
        service.setType(testUser, [1], -1 as TransactionType),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('statistics', () => {
    it('calculates statistics correctly', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue({
        rowCount: '5',
        totalExpenses: '100',
        totalIncomes: '500',
        total: '400',
      });

      // Mock for balance query
      const balanceQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: 400 }),
      };

      mockRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(balanceQueryBuilder);

      const result = await service.statistics(testUser, {
        where: { propertyId: 1 },
      });

      expect(result.rowCount).toBe(5);
      expect(result.totalExpenses).toBe(100);
      expect(result.totalIncomes).toBe(500);
      expect(result.total).toBe(400);
      expect(result.balance).toBe(400);
    });
  });
});
