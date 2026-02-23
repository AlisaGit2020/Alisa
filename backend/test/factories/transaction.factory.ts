import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import {
  TransactionStatus,
  TransactionType,
} from '@asset-backend/common/types';

export interface CreateTransactionOptions {
  id?: number;
  propertyId?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  sender?: string;
  receiver?: string;
  description?: string;
  transactionDate?: Date;
  accountingDate?: Date;
  amount?: number;
  balance?: number;
  externalId?: string;
  incomes?: Income[];
  expenses?: Expense[];
}

export const createTransaction = (
  options: CreateTransactionOptions = {},
): Transaction => {
  const transaction = new Transaction();
  transaction.id = options.id ?? 1;
  transaction.propertyId = options.propertyId ?? 1;
  transaction.status = options.status ?? TransactionStatus.ACCEPTED;
  transaction.type = options.type ?? TransactionType.INCOME;
  transaction.sender = options.sender ?? 'Test Sender';
  transaction.receiver = options.receiver ?? 'Test Receiver';
  transaction.description = options.description ?? 'Test Transaction';
  transaction.transactionDate = options.transactionDate ?? new Date('2023-01-15');
  transaction.accountingDate = options.accountingDate ?? new Date('2023-01-31');
  transaction.amount = options.amount ?? 100;
  transaction.balance = options.balance ?? 100;
  transaction.externalId = options.externalId;
  transaction.incomes = options.incomes;
  transaction.expenses = options.expenses;
  return transaction;
};

export const createExpenseTransaction = (
  options: Omit<CreateTransactionOptions, 'type'> = {},
): Transaction => {
  return createTransaction({
    ...options,
    type: TransactionType.EXPENSE,
    amount: options.amount !== undefined ? -Math.abs(options.amount) : -100,
  });
};

export const createIncomeTransaction = (
  options: Omit<CreateTransactionOptions, 'type'> = {},
): Transaction => {
  return createTransaction({
    ...options,
    type: TransactionType.INCOME,
    amount: options.amount ?? 100,
  });
};

export const createDepositTransaction = (
  options: Omit<CreateTransactionOptions, 'type'> = {},
): Transaction => {
  return createTransaction({
    ...options,
    type: TransactionType.DEPOSIT,
    amount: options.amount ?? 1000,
  });
};

export const createWithdrawTransaction = (
  options: Omit<CreateTransactionOptions, 'type'> = {},
): Transaction => {
  return createTransaction({
    ...options,
    type: TransactionType.WITHDRAW,
    amount: options.amount !== undefined ? -Math.abs(options.amount) : -100,
  });
};
