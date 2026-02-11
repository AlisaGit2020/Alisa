import { FindOptionsWhere } from 'typeorm';

// Supported languages for the application
export const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export enum TransactionStatus {
  PENDING = 1,
  ACCEPTED = 2,
}

export type TransactionStatusName = 'pending' | 'accepted';
export const transactionStatusNames = new Map<
  TransactionStatus,
  TransactionStatusName
>([
  [TransactionStatus.PENDING, 'pending'],
  [TransactionStatus.ACCEPTED, 'accepted'],
]);

export enum TransactionType {
  UNKNOWN = 0,
  INCOME = 1,
  EXPENSE = 2,
  DEPOSIT = 3,
  WITHDRAW = 4,
}
export enum TransactionTypeName {
  UNKNOWN = 'unknown',
  INCOME = 'income',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

export const transactionTypeNames = new Map<
  TransactionType,
  TransactionTypeName
>([
  [TransactionType.UNKNOWN, TransactionTypeName.UNKNOWN],
  [TransactionType.INCOME, TransactionTypeName.INCOME],
  [TransactionType.EXPENSE, TransactionTypeName.EXPENSE],
  [TransactionType.DEPOSIT, TransactionTypeName.DEPOSIT],
  [TransactionType.WITHDRAW, TransactionTypeName.WITHDRAW],
]);

export enum StatisticKey {
  BALANCE = 'balance',
  INCOME = 'income',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TAX_GROSS_INCOME = 'tax_gross_income',
  TAX_DEDUCTIONS = 'tax_deductions',
  TAX_DEPRECIATION = 'tax_depreciation',
  TAX_NET_INCOME = 'tax_net_income',
}

export type BetweenDates = {
  $between: [string, string];
};

export type FindOptionsWhereWithUserId<T> = FindOptionsWhere<T> & {
  userId: number;
};
