// Input DTO interfaces - for form submissions

import { TransactionStatus, TransactionType } from './common';

// Ownership input
export interface OwnershipInput {
  id?: number;
  userId: number;
  propertyId?: number;
  share: number;
}

// Property input
export interface PropertyInput {
  name: string;
  size: number;
  photo?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  buildYear?: number;
  apartmentType?: string;
  ownerships?: OwnershipInput[];
}

// ExpenseType input
export interface ExpenseTypeInput {
  id?: number;
  name: string;
  description?: string;
  isTaxDeductible: boolean;
  isCapitalImprovement: boolean;
}

// IncomeType input
export interface IncomeTypeInput {
  id?: number;
  name: string;
  description?: string;
  isTaxable?: boolean;
}

// Expense input
export interface ExpenseInput {
  id?: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  accountingDate?: Date;
  expenseType?: ExpenseTypeInput;
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
  incomeType?: IncomeTypeInput;
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
