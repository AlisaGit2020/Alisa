import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';

export interface CreateExpenseOptions {
  id?: number;
  propertyId?: number;
  transactionId?: number;
  expenseTypeId?: number;
  description?: string;
  amount?: number;
  quantity?: number;
  totalAmount?: number;
}

export const createExpense = (options: CreateExpenseOptions = {}): Expense => {
  const expense = new Expense();
  expense.id = options.id ?? 1;
  expense.propertyId = options.propertyId ?? 1;
  expense.transactionId = options.transactionId !== undefined ? options.transactionId : 1;
  expense.expenseTypeId = options.expenseTypeId ?? 1;
  expense.description = options.description ?? 'Test Expense';
  expense.amount = options.amount ?? 100;
  expense.quantity = options.quantity ?? 1;
  expense.totalAmount = options.totalAmount ?? 100;
  return expense;
};

export interface CreateExpenseTypeOptions {
  id?: number;
  userId?: number;
  name?: string;
  description?: string;
  isTaxDeductible?: boolean;
}

export const createExpenseType = (
  options: CreateExpenseTypeOptions = {},
): ExpenseType => {
  const expenseType = new ExpenseType();
  expenseType.id = options.id ?? 1;
  expenseType.userId = options.userId ?? 1;
  expenseType.name = options.name ?? 'Test Expense Type';
  expenseType.description = options.description ?? 'Test Description';
  expenseType.isTaxDeductible = options.isTaxDeductible ?? false;
  return expenseType;
};
