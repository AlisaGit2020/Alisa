// Input DTO interfaces - for form submissions

import {
  PropertyExternalSource,
  PropertyStatus,
  TransactionStatus,
  TransactionType,
} from './common';

// Ownership input
export interface OwnershipInput {
  userId: number;
  propertyId?: number;
  share: number;
}

// Address input
export interface AddressInput {
  id?: number;
  street?: string;
  city?: string;
  postalCode?: string;
}

// Property input
export interface PropertyInput {
  name: string;
  size: number;
  photo?: string;
  description?: string;
  address?: AddressInput;
  buildYear?: number;
  apartmentType?: string;
  status?: PropertyStatus;
  externalSource?: PropertyExternalSource;
  externalSourceId?: string;
  ownerships?: OwnershipInput[];
}

// Expense input
export interface ExpenseInput {
  id?: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  accountingDate?: Date;
  expenseTypeId?: number;
  property?: PropertyInput;
  propertyId?: number;
  transaction?: TransactionInput;
  transactionId?: number | null;
}

// Income input
export interface IncomeInput {
  id?: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  accountingDate?: Date;
  incomeTypeId?: number;
  property?: PropertyInput;
  propertyId?: number;
  transaction?: TransactionInput;
  transactionId?: number | null;
}

// Transaction input
export interface TransactionInput {
  id?: number;
  externalId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  sender: string;
  receiver: string;
  description: string;
  transactionDate: Date;
  accountingDate: Date;
  amount: number;
  propertyId?: number;
  expenses?: ExpenseInput[];
  incomes?: IncomeInput[];
}

// Transaction accept input
export interface TransactionAcceptInput {
  ids: number[];
}

// Transaction set type input
export interface TransactionSetTypeInput {
  ids: number[];
  type: TransactionType;
}

// Transaction set category type input
export interface TransactionSetCategoryTypeInput {
  ids: number[];
  expenseTypeId?: number;
  incomeTypeId?: number;
}

// Split loan payment bulk input
export interface SplitLoanPaymentBulkInput {
  ids: number[];
  principalExpenseTypeId: number;
  interestExpenseTypeId: number;
  handlingFeeExpenseTypeId?: number;
}

// OP import input
export interface OpImportInput {
  file: string;
  fileName?: string;
  propertyId: number;
}

// S-Pankki import input
export interface SPankkiImportInput {
  file: string;
  fileName?: string;
  propertyId: number;
}
