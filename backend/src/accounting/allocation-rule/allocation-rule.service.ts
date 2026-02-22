import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AllocationRule } from './entities/allocation-rule.entity';
import { AllocationRuleInputDto } from './dtos/allocation-rule-input.dto';
import {
  AllocationResultDto,
  AllocatedTransactionDto,
  SkippedTransactionDto,
  ConflictingTransactionDto,
} from './dtos/allocation-result.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import {
  AllocationCondition,
  ExpenseTypeKey,
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import {
  isLoanPaymentMessage,
  parseLoanPaymentMessage,
} from '@alisa-backend/common/utils/loan-message-parser';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';

@Injectable()
export class AllocationRuleService {
  constructor(
    @InjectRepository(AllocationRule)
    private repository: Repository<AllocationRule>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    private authService: AuthService,
    private transactionService: TransactionService,
    private expenseTypeService: ExpenseTypeService,
  ) {}

  async findByProperty(user: JWTUser, propertyId: number): Promise<AllocationRule[]> {
    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    return this.repository.find({
      where: { propertyId },
      order: { priority: 'ASC' },
      relations: ['expenseType', 'incomeType'],
    });
  }

  async findOne(user: JWTUser, id: number): Promise<AllocationRule> {
    const rule = await this.repository.findOne({
      where: { id },
      relations: ['expenseType', 'incomeType'],
    });

    if (!rule) {
      throw new NotFoundException('Allocation rule not found');
    }

    if (!(await this.authService.hasOwnership(user, rule.propertyId))) {
      throw new UnauthorizedException();
    }

    return rule;
  }

  async create(user: JWTUser, input: AllocationRuleInputDto): Promise<AllocationRule> {
    if (!(await this.authService.hasOwnership(user, input.propertyId))) {
      throw new UnauthorizedException();
    }

    this.validateInput(input);

    // Get the max priority for this property
    const maxPriorityResult = await this.repository
      .createQueryBuilder('rule')
      .select('MAX(rule.priority)', 'maxPriority')
      .where('rule.propertyId = :propertyId', { propertyId: input.propertyId })
      .getRawOne();

    const maxPriority = maxPriorityResult?.maxPriority ?? -1;

    const rule = new AllocationRule();
    rule.name = input.name;
    rule.propertyId = input.propertyId;
    rule.priority = input.priority ?? maxPriority + 1;
    rule.transactionType = input.transactionType;
    rule.expenseTypeId = input.expenseTypeId ?? null;
    rule.incomeTypeId = input.incomeTypeId ?? null;
    rule.conditions = input.conditions;
    rule.isActive = input.isActive ?? true;

    return this.repository.save(rule);
  }

  async update(
    user: JWTUser,
    id: number,
    input: AllocationRuleInputDto,
  ): Promise<AllocationRule> {
    const rule = await this.findOne(user, id);

    this.validateInput(input);

    rule.name = input.name;
    rule.transactionType = input.transactionType;
    rule.expenseTypeId = input.expenseTypeId ?? null;
    rule.incomeTypeId = input.incomeTypeId ?? null;
    rule.conditions = input.conditions;
    if (input.isActive !== undefined) {
      rule.isActive = input.isActive;
    }

    return this.repository.save(rule);
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const rule = await this.findOne(user, id);
    await this.repository.remove(rule);
  }

  async reorder(
    user: JWTUser,
    propertyId: number,
    ruleIds: number[],
  ): Promise<AllocationRule[]> {
    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    const rules = await this.repository.find({
      where: { propertyId, id: In(ruleIds) },
    });

    if (rules.length !== ruleIds.length) {
      throw new BadRequestException(
        'Some rule IDs do not exist or do not belong to this property',
      );
    }

    // Update priorities based on the order in ruleIds
    const updatePromises = ruleIds.map((ruleId, index) => {
      return this.repository.update(ruleId, { priority: index });
    });

    await Promise.all(updatePromises);

    return this.findByProperty(user, propertyId);
  }

  async apply(
    user: JWTUser,
    propertyId: number,
    transactionIds: number[],
  ): Promise<AllocationResultDto> {
    if (!(await this.authService.hasOwnership(user, propertyId))) {
      throw new UnauthorizedException();
    }

    if (transactionIds.length === 0) {
      return { allocated: [], skipped: [], conflicting: [] };
    }

    // Get active rules for this property, ordered by priority
    const rules = await this.repository.find({
      where: { propertyId, isActive: true },
      order: { priority: 'ASC' },
    });

    // Get transactions with their relationships
    const transactions = await this.transactionRepository.find({
      where: { id: In(transactionIds), propertyId },
      relations: ['expenses', 'incomes'],
    });

    // Pre-fetch expense types for loan payment handling
    const [principalExpenseType, interestExpenseType, handlingFeeExpenseType, loanPaymentExpenseType] =
      await Promise.all([
        this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_PRINCIPAL),
        this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_INTEREST),
        this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_HANDLING_FEE),
        this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_PAYMENT),
      ]);

    const result: AllocationResultDto = {
      allocated: [],
      skipped: [],
      conflicting: [],
    };

    for (const transaction of transactions) {
      // Skip already accepted transactions
      if (transaction.status === TransactionStatus.ACCEPTED) {
        result.skipped.push({
          transactionId: transaction.id,
          reason: 'already_allocated',
        } as SkippedTransactionDto);
        continue;
      }

      // Skip transactions that already have a type set (not UNKNOWN)
      if (transaction.type !== TransactionType.UNKNOWN) {
        result.skipped.push({
          transactionId: transaction.id,
          reason: 'already_allocated',
        } as SkippedTransactionDto);
        continue;
      }

      // Find matching rules
      const matchingRules = rules.filter((rule) =>
        this.matchesAllConditions(transaction, rule.conditions),
      );

      if (matchingRules.length === 0) {
        result.skipped.push({
          transactionId: transaction.id,
          reason: 'no_match',
        } as SkippedTransactionDto);
      } else if (matchingRules.length === 1) {
        const rule = matchingRules[0];

        // Check if this is a LOAN_PAYMENT type (trigger for loan split)
        if (
          loanPaymentExpenseType &&
          rule.expenseTypeId === loanPaymentExpenseType.id
        ) {
          // Handle loan payment auto-split
          const splitResult = await this.handleLoanPaymentSplit(
            transaction,
            principalExpenseType?.id,
            interestExpenseType?.id,
            handlingFeeExpenseType?.id,
          );

          if (splitResult.success) {
            result.allocated.push({
              transactionId: transaction.id,
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'loan_split',
            } as AllocatedTransactionDto);
          } else {
            result.skipped.push({
              transactionId: transaction.id,
              reason: 'loan_split_failed',
            } as SkippedTransactionDto);
          }
        } else {
          // Standard type allocation
          await this.applyRule(transaction, rule);
          result.allocated.push({
            transactionId: transaction.id,
            ruleId: rule.id,
            ruleName: rule.name,
            action: 'type_set',
          } as AllocatedTransactionDto);
        }
      } else {
        result.conflicting.push({
          transactionId: transaction.id,
          matchingRules: matchingRules.map((r) => ({ id: r.id, name: r.name })),
        } as ConflictingTransactionDto);
      }
    }

    return result;
  }

  private validateInput(input: AllocationRuleInputDto): void {
    if (input.conditions.length === 0) {
      throw new BadRequestException('At least one condition is required');
    }

    // Validate that expense/income type matches transaction type
    if (
      input.transactionType === TransactionType.EXPENSE &&
      input.incomeTypeId
    ) {
      throw new BadRequestException(
        'Cannot set income type for expense transactions',
      );
    }

    if (
      input.transactionType === TransactionType.INCOME &&
      input.expenseTypeId
    ) {
      throw new BadRequestException(
        'Cannot set expense type for income transactions',
      );
    }

    // Validate condition operators match field types
    for (const condition of input.conditions) {
      if (condition.field === 'amount') {
        if (
          condition.operator !== 'equals' &&
          condition.operator !== 'greaterThan' &&
          condition.operator !== 'lessThan'
        ) {
          throw new BadRequestException(
            `Invalid operator "${condition.operator}" for amount field`,
          );
        }
      } else {
        if (
          condition.operator !== 'equals' &&
          condition.operator !== 'contains'
        ) {
          throw new BadRequestException(
            `Invalid operator "${condition.operator}" for text field "${condition.field}"`,
          );
        }
      }
    }
  }

  private matchesAllConditions(
    transaction: Transaction,
    conditions: AllocationCondition[],
  ): boolean {
    return conditions.every((condition) =>
      this.matchesCondition(transaction, condition),
    );
  }

  private matchesCondition(
    transaction: Transaction,
    condition: AllocationCondition,
  ): boolean {
    const fieldValue = this.getFieldValue(transaction, condition.field);

    if (condition.field === 'amount') {
      const numericValue = typeof fieldValue === 'number' ? fieldValue : 0;
      const conditionValue = parseFloat(condition.value);

      switch (condition.operator) {
        case 'equals':
          return Math.abs(numericValue) === Math.abs(conditionValue);
        case 'greaterThan':
          return Math.abs(numericValue) > Math.abs(conditionValue);
        case 'lessThan':
          return Math.abs(numericValue) < Math.abs(conditionValue);
        default:
          return false;
      }
    } else {
      const textValue =
        typeof fieldValue === 'string' ? fieldValue.toLowerCase() : '';
      const conditionValueLower = condition.value.toLowerCase();

      switch (condition.operator) {
        case 'equals':
          return textValue === conditionValueLower;
        case 'contains':
          return textValue.includes(conditionValueLower);
        default:
          return false;
      }
    }
  }

  private getFieldValue(
    transaction: Transaction,
    field: AllocationCondition['field'],
  ): string | number {
    switch (field) {
      case 'sender':
        return transaction.sender ?? '';
      case 'receiver':
        return transaction.receiver ?? '';
      case 'description':
        return transaction.description ?? '';
      case 'amount':
        return transaction.amount ?? 0;
      default:
        return '';
    }
  }

  private async applyRule(
    transaction: Transaction,
    rule: AllocationRule,
  ): Promise<void> {
    transaction.type = rule.transactionType;

    // Set expense type if applicable
    if (
      rule.transactionType === TransactionType.EXPENSE &&
      rule.expenseTypeId
    ) {
      if (transaction.expenses && transaction.expenses.length > 0) {
        for (const expense of transaction.expenses) {
          expense.expenseTypeId = rule.expenseTypeId;
        }
      } else {
        transaction.expenses = [
          {
            expenseTypeId: rule.expenseTypeId,
            propertyId: transaction.propertyId,
            transactionId: transaction.id,
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            quantity: 1,
            totalAmount: Math.abs(transaction.amount),
            accountingDate: transaction.accountingDate,
          } as Expense,
        ];
      }
    }

    // Set income type if applicable
    if (rule.transactionType === TransactionType.INCOME && rule.incomeTypeId) {
      if (transaction.incomes && transaction.incomes.length > 0) {
        for (const income of transaction.incomes) {
          income.incomeTypeId = rule.incomeTypeId;
        }
      } else {
        transaction.incomes = [
          {
            incomeTypeId: rule.incomeTypeId,
            propertyId: transaction.propertyId,
            transactionId: transaction.id,
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            quantity: 1,
            totalAmount: Math.abs(transaction.amount),
            accountingDate: transaction.accountingDate,
          } as Income,
        ];
      }
    }

    await this.transactionRepository.save(transaction);
  }

  private async handleLoanPaymentSplit(
    transaction: Transaction,
    principalExpenseTypeId: number | undefined,
    interestExpenseTypeId: number | undefined,
    handlingFeeExpenseTypeId: number | undefined,
  ): Promise<{ success: boolean }> {
    if (!isLoanPaymentMessage(transaction.description)) {
      return { success: false };
    }

    if (!principalExpenseTypeId || !interestExpenseTypeId) {
      return { success: false };
    }

    const loanComponents = parseLoanPaymentMessage(transaction.description);
    if (!loanComponents) {
      return { success: false };
    }

    // Create expense records for each loan component
    const expenses: Partial<Expense>[] = [];

    if (loanComponents.principal > 0) {
      expenses.push({
        expenseTypeId: principalExpenseTypeId,
        propertyId: transaction.propertyId,
        transactionId: transaction.id,
        description: 'Lainan lyhennys',
        amount: loanComponents.principal,
        quantity: 1,
        totalAmount: loanComponents.principal,
        accountingDate: transaction.accountingDate,
      });
    }

    if (loanComponents.interest > 0) {
      expenses.push({
        expenseTypeId: interestExpenseTypeId,
        propertyId: transaction.propertyId,
        transactionId: transaction.id,
        description: 'Lainan korko',
        amount: loanComponents.interest,
        quantity: 1,
        totalAmount: loanComponents.interest,
        accountingDate: transaction.accountingDate,
      });
    }

    if (loanComponents.handlingFee > 0 && handlingFeeExpenseTypeId) {
      expenses.push({
        expenseTypeId: handlingFeeExpenseTypeId,
        propertyId: transaction.propertyId,
        transactionId: transaction.id,
        description: 'Lainakulut',
        amount: loanComponents.handlingFee,
        quantity: 1,
        totalAmount: loanComponents.handlingFee,
        accountingDate: transaction.accountingDate,
      });
    }

    transaction.type = TransactionType.EXPENSE;
    transaction.expenses = expenses as Expense[];

    await this.transactionRepository.save(transaction);

    return { success: true };
  }
}
