import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { ExpenseType } from '@asset-backend/accounting/expense/entities/expense-type.entity';
import { ExpenseTypeKey } from '@asset-backend/common/types';

export interface CreateExpenseOptions {
  id?: number;
  propertyId?: number;
  transactionId?: number;
  expenseTypeId?: number;
  description?: string;
  amount?: number;
  quantity?: number;
  totalAmount?: number;
  accountingDate?: Date | null;
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
  if (options.accountingDate !== undefined) {
    expense.accountingDate = options.accountingDate;
  }
  return expense;
};

export interface CreateExpenseTypeOptions {
  id?: number;
  key?: ExpenseTypeKey;
  isTaxDeductible?: boolean;
  isCapitalImprovement?: boolean;
}

export const createExpenseType = (
  options: CreateExpenseTypeOptions = {},
): ExpenseType => {
  const expenseType = new ExpenseType();
  expenseType.id = options.id ?? 1;
  expenseType.key = options.key ?? ExpenseTypeKey.REPAIRS;
  expenseType.isTaxDeductible = options.isTaxDeductible ?? false;
  expenseType.isCapitalImprovement = options.isCapitalImprovement ?? false;
  return expenseType;
};
