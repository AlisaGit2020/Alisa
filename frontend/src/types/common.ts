// Common enums and shared types

// Supported languages for the application
export const SUPPORTED_LANGUAGES = ['en', 'fi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export enum TransactionStatus {
  PENDING = 1,
  ACCEPTED = 2,
}

export type TransactionStatusName = 'pending' | 'accepted';

export const transactionStatusNames = new Map<TransactionStatus, TransactionStatusName>([
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

export const transactionTypeNames = new Map<TransactionType, TransactionTypeName>([
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

// Dashboard config types
export type WidgetSize = '1/1' | '1/2' | '1/3' | '1/4';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
  size?: WidgetSize;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
}

// Data save result
export interface DataSaveResultRow {
  id: number;
  statusCode: number;
  message: string;
}

export interface DataSaveResult {
  rows: {
    total: number;
    success: number;
    failed: number;
  };
  allSuccess: boolean;
  results: DataSaveResultRow[];
}

// Delete validation types
export interface DependencyItem {
  id: number;
  description: string;
}

export type DependencyType =
  | 'transaction'
  | 'expense'
  | 'income'
  | 'statistics'
  | 'depreciationAsset';

export interface DependencyGroup {
  type: DependencyType;
  count: number;
  samples: DependencyItem[];
}

export interface DeleteValidationResult {
  canDelete: boolean;
  dependencies: DependencyGroup[];
  message?: string;
}
