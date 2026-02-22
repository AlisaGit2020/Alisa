import { AllocationRule } from '@alisa-backend/accounting/allocation-rule/entities/allocation-rule.entity';
import {
  AllocationCondition,
  TransactionType,
} from '@alisa-backend/common/types';

export interface CreateAllocationRuleOptions {
  id?: number;
  name?: string;
  propertyId?: number;
  priority?: number;
  transactionType?: TransactionType;
  expenseTypeId?: number | null;
  incomeTypeId?: number | null;
  conditions?: AllocationCondition[];
  isActive?: boolean;
}

export const createAllocationRule = (
  options: CreateAllocationRuleOptions = {},
): AllocationRule => {
  const rule = new AllocationRule();
  rule.id = options.id ?? 1;
  rule.name = options.name ?? 'Test Rule';
  rule.propertyId = options.propertyId ?? 1;
  rule.priority = options.priority ?? 0;
  rule.transactionType = options.transactionType ?? TransactionType.EXPENSE;
  rule.expenseTypeId = options.expenseTypeId ?? null;
  rule.incomeTypeId = options.incomeTypeId ?? null;
  rule.conditions = options.conditions ?? [
    { field: 'description', operator: 'contains', value: 'test' },
  ];
  rule.isActive = options.isActive ?? true;
  return rule;
};

export const createExpenseAllocationRule = (
  options: Omit<CreateAllocationRuleOptions, 'transactionType' | 'incomeTypeId'> = {},
): AllocationRule => {
  return createAllocationRule({
    ...options,
    transactionType: TransactionType.EXPENSE,
    expenseTypeId: options.expenseTypeId ?? 1,
    incomeTypeId: null,
  });
};

export const createIncomeAllocationRule = (
  options: Omit<CreateAllocationRuleOptions, 'transactionType' | 'expenseTypeId'> = {},
): AllocationRule => {
  return createAllocationRule({
    ...options,
    transactionType: TransactionType.INCOME,
    incomeTypeId: options.incomeTypeId ?? 1,
    expenseTypeId: null,
  });
};
