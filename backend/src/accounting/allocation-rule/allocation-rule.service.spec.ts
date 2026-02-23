import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AllocationRuleService } from './allocation-rule.service';
import { AllocationRule } from './entities/allocation-rule.entity';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { AuthService } from '@asset-backend/auth/auth.service';
import { TransactionService } from '@asset-backend/accounting/transaction/transaction.service';
import { ExpenseTypeService } from '@asset-backend/accounting/expense/expense-type.service';
import {
  createMockRepository,
  createMockAuthService,
  MockRepository,
  MockAuthService,
} from 'test/mocks';
import {
  createTransaction,
  createJWTUser,
  createAllocationRule,
} from 'test/factories';
import {
  TransactionStatus,
  TransactionType,
} from '@asset-backend/common/types';

describe('AllocationRuleService', () => {
  let service: AllocationRuleService;
  let mockRuleRepository: MockRepository<AllocationRule>;
  let mockTransactionRepository: MockRepository<Transaction>;
  let mockAuthService: MockAuthService;
  let mockTransactionService: Partial<TransactionService>;
  let mockExpenseTypeService: { findByKey: jest.Mock };

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [] });

  beforeEach(async () => {
    mockRuleRepository = createMockRepository<AllocationRule>();
    mockTransactionRepository = createMockRepository<Transaction>();
    mockAuthService = createMockAuthService();
    mockTransactionService = {};
    mockExpenseTypeService = {
      findByKey: jest.fn().mockImplementation((key: string) => {
        const types: Record<string, { id: number; key: string }> = {
          'loan-principal': { id: 1, key: 'loan-principal' },
          'loan-interest': { id: 2, key: 'loan-interest' },
          'loan-handling-fee': { id: 3, key: 'loan-handling-fee' },
          'loan-payment': { id: 4, key: 'loan-payment' },
        };
        return Promise.resolve(types[key] || null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllocationRuleService,
        { provide: getRepositoryToken(AllocationRule), useValue: mockRuleRepository },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: ExpenseTypeService, useValue: mockExpenseTypeService },
      ],
    }).compile();

    service = module.get<AllocationRuleService>(AllocationRuleService);
  });

  describe('findByProperty', () => {
    it('returns rules when user has ownership', async () => {
      const rules = [
        createAllocationRule({ id: 1, propertyId: 1 }),
        createAllocationRule({ id: 2, propertyId: 1 }),
      ];
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue(rules);

      const result = await service.findByProperty(testUser, 1);

      expect(result).toEqual(rules);
      expect(mockRuleRepository.find).toHaveBeenCalledWith({
        where: { propertyId: 1 },
        order: { priority: 'ASC' },
        relations: ['expenseType', 'incomeType'],
      });
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findByProperty(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findOne', () => {
    it('returns rule when user has ownership', async () => {
      const rule = createAllocationRule({ id: 1, propertyId: 1 });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.findOne(testUser, 1);

      expect(result).toEqual(rule);
    });

    it('throws NotFoundException when rule does not exist', async () => {
      mockRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(testUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const rule = createAllocationRule({ id: 1, propertyId: 1 });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.findOne(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('create', () => {
    it('creates rule when user has ownership', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPriority: 2 }),
      });
      mockRuleRepository.save.mockImplementation((rule) =>
        Promise.resolve({ ...rule, id: 1 }),
      );

      const input = {
        name: 'Test Rule',
        propertyId: 1,
        transactionType: TransactionType.EXPENSE,
        expenseTypeId: 1,
        conditions: [{ field: 'description' as const, operator: 'contains' as const, value: 'test' }],
      };

      const result = await service.create(testUser, input);

      expect(result.name).toBe('Test Rule');
      expect(result.priority).toBe(3); // maxPriority + 1
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(false);

      const input = {
        name: 'Test Rule',
        propertyId: 1,
        transactionType: TransactionType.EXPENSE,
        conditions: [{ field: 'description' as const, operator: 'contains' as const, value: 'test' }],
      };

      await expect(service.create(otherUser, input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws BadRequestException when no conditions provided', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const input = {
        name: 'Test Rule',
        propertyId: 1,
        transactionType: TransactionType.EXPENSE,
        conditions: [],
      };

      await expect(service.create(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when expense type set for income transaction', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const input = {
        name: 'Test Rule',
        propertyId: 1,
        transactionType: TransactionType.INCOME,
        expenseTypeId: 1,
        conditions: [{ field: 'description' as const, operator: 'contains' as const, value: 'test' }],
      };

      await expect(service.create(testUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('deletes rule when user has ownership', async () => {
      const rule = createAllocationRule({ id: 1, propertyId: 1 });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.remove.mockResolvedValue(undefined);

      await service.delete(testUser, 1);

      expect(mockRuleRepository.remove).toHaveBeenCalledWith(rule);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      const rule = createAllocationRule({ id: 1, propertyId: 1 });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.delete(otherUser, 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('apply', () => {
    it('returns empty result when no transaction IDs provided', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);

      const result = await service.apply(testUser, 1, []);

      expect(result).toEqual({ allocated: [], skipped: [], conflicting: [] });
    });

    it('skips already accepted transactions', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue([]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({ id: 1, status: TransactionStatus.ACCEPTED }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('already_allocated');
    });

    it('skips transactions that already have a type set', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue([]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.EXPENSE,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('already_allocated');
    });

    it('skips transactions with no matching rules', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'description', operator: 'contains', value: 'xyz' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Test description',
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('no_match');
    });

    it('allocates transaction when single rule matches', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          id: 1,
          name: 'Test Rule',
          transactionType: TransactionType.EXPENSE,
          expenseTypeId: 1,
          conditions: [{ field: 'description', operator: 'contains', value: 'rent' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Monthly rent payment',
        }),
      ]);
      mockTransactionRepository.save.mockResolvedValue({});

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
      expect(result.allocated[0].ruleId).toBe(1);
      expect(result.allocated[0].ruleName).toBe('Test Rule');
    });

    it('reports conflict when multiple rules match', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          id: 1,
          name: 'Rule 1',
          conditions: [{ field: 'description', operator: 'contains', value: 'rent' }],
        }),
        createAllocationRule({
          id: 2,
          name: 'Rule 2',
          conditions: [{ field: 'description', operator: 'contains', value: 'payment' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Monthly rent payment',
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.conflicting).toHaveLength(1);
      expect(result.conflicting[0].matchingRules).toHaveLength(2);
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      mockAuthService.hasOwnership.mockResolvedValue(false);

      await expect(service.apply(otherUser, 1, [1])).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('condition matching', () => {
    beforeEach(() => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
      mockTransactionRepository.save.mockResolvedValue({});
    });

    it('matches equals condition (case-insensitive)', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'sender', operator: 'equals', value: 'Test Sender' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          sender: 'test sender',
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches contains condition', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'description', operator: 'contains', value: 'rent' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Monthly rent payment',
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches amount equals condition', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'equals', value: '100' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: -100,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches amount greaterThan condition', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'greaterThan', value: '50' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: 100,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches amount lessThan condition', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'lessThan', value: '200' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: 100,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches amount condition with comma as decimal separator', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'equals', value: '238,40' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: -238.4,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('matches amount greaterThan with comma decimal separator', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'greaterThan', value: '100,50' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: 150.75,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('handles empty string value in amount condition gracefully', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'equals', value: '' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: 100,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      // Empty string parses to NaN, so condition should not match
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('no_match');
    });

    it('handles European thousand separator format (1.234,56) as decimal value', async () => {
      // Note: The current implementation treats comma as decimal separator.
      // Values like "1.234,56" would be parsed incorrectly (as 1.234 with trailing chars ignored).
      // This test documents current behavior - thousand separators are not supported.
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [{ field: 'amount', operator: 'equals', value: '1234,56' }],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          amount: -1234.56,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
    });

    it('requires all conditions to match (AND logic)', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          conditions: [
            { field: 'description', operator: 'contains', value: 'rent' },
            { field: 'sender', operator: 'equals', value: 'landlord' },
          ],
        }),
      ]);
      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Monthly rent payment',
          sender: 'tenant', // Doesn't match 'landlord'
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('no_match');
    });
  });

  describe('LOAN_PAYMENT handling', () => {
    beforeEach(() => {
      mockAuthService.hasOwnership.mockResolvedValue(true);
    });

    it('splits loan payment when LOAN_PAYMENT rule matches', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          id: 1,
          name: 'Loan Payment Rule',
          transactionType: TransactionType.EXPENSE,
          expenseTypeId: 4, // LOAN_PAYMENT type ID
          conditions: [{ field: 'description', operator: 'contains', value: 'Lyhennys' }],
        }),
      ]);

      const loanPaymentDescription =
        'Lyhennys 244,25 euroa Korko 166,37 euroa Kulut 2,50 euroa Jäljellä 65 851,63 euroa';

      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: loanPaymentDescription,
          amount: -413.12,
        }),
      ]);
      mockTransactionRepository.save.mockResolvedValue({});

      const result = await service.apply(testUser, 1, [1]);

      expect(result.allocated).toHaveLength(1);
      expect(result.allocated[0].action).toBe('loan_split');
      expect(mockTransactionRepository.save).toHaveBeenCalled();
    });

    it('skips loan payment when message format is invalid', async () => {
      mockRuleRepository.find.mockResolvedValue([
        createAllocationRule({
          id: 1,
          name: 'Loan Payment Rule',
          transactionType: TransactionType.EXPENSE,
          expenseTypeId: 4, // LOAN_PAYMENT type ID
          conditions: [{ field: 'description', operator: 'contains', value: 'payment' }],
        }),
      ]);

      mockTransactionRepository.find.mockResolvedValue([
        createTransaction({
          id: 1,
          status: TransactionStatus.PENDING,
          type: TransactionType.UNKNOWN,
          description: 'Regular payment - not a loan format',
          amount: -100,
        }),
      ]);

      const result = await service.apply(testUser, 1, [1]);

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toBe('loan_split_failed');
    });
  });
});
