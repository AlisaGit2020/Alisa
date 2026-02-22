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
  AIRBNB_VISITS = 'airbnb_visits',
}

export type BetweenDates = {
  $between: [string, string];
};

export type FindOptionsWhereWithUserId<T> = FindOptionsWhere<T> & {
  userId: number;
};

export enum PropertyStatus {
  PROSPECT = 1,
  OWN = 2,
  SOLD = 3,
}

export enum PropertyStatusName {
  PROSPECT = 'prospect',
  OWN = 'own',
  SOLD = 'sold',
}

export const propertyStatusNames = new Map<PropertyStatus, PropertyStatusName>([
  [PropertyStatus.PROSPECT, PropertyStatusName.PROSPECT],
  [PropertyStatus.OWN, PropertyStatusName.OWN],
  [PropertyStatus.SOLD, PropertyStatusName.SOLD],
]);

export enum PropertyExternalSource {
  OIKOTIE = 1,
  ETUOVI = 2,
}

export enum PropertyExternalSourceName {
  OIKOTIE = 'oikotie',
  ETUOVI = 'etuovi',
}

export const propertyExternalSourceNames = new Map<
  PropertyExternalSource,
  PropertyExternalSourceName
>([
  [PropertyExternalSource.OIKOTIE, PropertyExternalSourceName.OIKOTIE],
  [PropertyExternalSource.ETUOVI, PropertyExternalSourceName.ETUOVI],
]);

// Global expense type keys (translations are handled by i18n using these keys)
export enum ExpenseTypeKey {
  HOUSING_CHARGE = 'housing-charge',
  MAINTENANCE_CHARGE = 'maintenance-charge',
  FINANCIAL_CHARGE = 'financial-charge',
  REPAIRS = 'repairs',
  CAPITAL_IMPROVEMENT = 'capital-improvement',
  INSURANCE = 'insurance',
  PROPERTY_TAX = 'property-tax',
  WATER = 'water',
  ELECTRICITY = 'electricity',
  RENTAL_BROKERAGE = 'rental-brokerage',
  LOAN_INTEREST = 'loan-interest',
  LOAN_PRINCIPAL = 'loan-principal',
  LOAN_HANDLING_FEE = 'loan-handling-fee',
  LOAN_PAYMENT = 'loan-payment',
  CLEANING = 'cleaning',
}

// Global income type keys (translations are handled by i18n using these keys)
export enum IncomeTypeKey {
  RENTAL = 'rental',
  AIRBNB = 'airbnb',
  CAPITAL_INCOME = 'capital-income',
  INSURANCE_COMPENSATION = 'insurance-compensation',
}

// Allocation rule condition types
export type AllocationConditionField =
  | 'sender'
  | 'receiver'
  | 'description'
  | 'amount';
export type AllocationConditionOperator =
  | 'equals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan';

export interface AllocationCondition {
  field: AllocationConditionField;
  operator: AllocationConditionOperator;
  value: string;
}
