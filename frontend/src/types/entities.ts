// Entity interfaces - pure TypeScript types without decorators

import {
  DashboardConfig,
  PropertyExternalSource,
  PropertyStatus,
  TransactionStatus,
  TransactionType,
} from './common';

// Address
export interface Address {
  id: number;
  street?: string;
  city?: string;
  postalCode?: string;
}

// Tier
export interface Tier {
  id: number;
  name: string;
  price: number;
  maxProperties: number;
  sortOrder: number;
  isDefault: boolean;
}

// User
export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  language?: string;
  photo?: string;
  tier?: Tier;
  tierId?: number;
  ownerships?: Ownership[];
  expenseTypes?: ExpenseType[];
  incomeTypes?: IncomeType[];
  loanPrincipalExpenseTypeId?: number;
  loanInterestExpenseTypeId?: number;
  loanHandlingFeeExpenseTypeId?: number;
  airbnbIncomeTypeId?: number;
  dashboardConfig?: DashboardConfig;
  isAdmin: boolean;
}

// Ownership
export interface Ownership {
  share: number;
  user?: User;
  userId: number;
  property?: Property;
  propertyId: number;
}

// Property
export interface Property {
  id: number;
  name: string;
  size: number;
  transactions?: Transaction[];
  expenses?: Expense[];
  incomes?: Income[];
  ownerships?: Ownership[];
  statistics?: PropertyStatistics[];
  photo?: string;
  description?: string;
  address?: Address;
  buildYear?: number;
  apartmentType?: string;
  status: PropertyStatus;
  externalSource?: PropertyExternalSource;
  externalSourceId?: string;
}

// PropertyStatistics
export interface PropertyStatistics {
  id: number;
  property?: Property;
  propertyId: number;
  key: string;
  year: number;
  month: number;
  value: string;
}

// ExpenseType
export interface ExpenseType {
  id: number;
  user?: User;
  userId: number;
  expenses?: Expense[];
  name: string;
  description: string;
  isTaxDeductible: boolean;
  isCapitalImprovement: boolean;
}

// IncomeType
export interface IncomeType {
  id: number;
  user?: User;
  userId: number;
  incomes?: Income[];
  name: string;
  description: string;
  isTaxable: boolean;
}

// Expense
export interface Expense {
  id: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  accountingDate: Date;
  expenseType?: ExpenseType;
  expenseTypeId: number;
  property?: Property;
  propertyId: number;
  transaction?: Transaction;
  transactionId: number | null;
}

// Income
export interface Income {
  id: number;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  accountingDate: Date;
  incomeType?: IncomeType;
  incomeTypeId: number;
  property?: Property;
  propertyId: number;
  transaction?: Transaction;
  transactionId: number | null;
}

// Transaction
export interface Transaction {
  id: number;
  externalId?: string;
  status: TransactionStatus;
  type: TransactionType;
  sender: string;
  receiver: string;
  description: string;
  transactionDate: Date;
  accountingDate: Date;
  amount: number;
  balance: number;
  property?: Property;
  propertyId: number;
  expenses?: Expense[];
  incomes?: Income[];
}
