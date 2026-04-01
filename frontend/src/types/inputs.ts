// Input DTO interfaces - for form submissions

import {
  AllocationCondition,
  ChargeType,
  PropertyExternalSource,
  PropertyStatus,
  PropertyType,
  TaxDeductionType,
  TransactionStatus,
  TransactionType,
} from './common';
import { TaxDeductionMetadata } from './entities';

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
  district?: string;
}

// Property input
export interface PropertyInput {
  name: string;
  size: number;
  photo?: string;
  description?: string;
  address?: AddressInput;
  buildYear?: number;
  apartmentType?: PropertyType;
  status?: PropertyStatus;
  externalSource?: PropertyExternalSource;
  externalSourceId?: string;
  rooms?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  purchaseLoan?: number;
  salePrice?: number;
  saleDate?: Date;
  debtShare?: number;
  monthlyRent?: number;
  isAirbnb?: boolean;
  distanceFromHome?: number;
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

// Allocation rule input
export interface AllocationRuleInput {
  id?: number;
  name: string;
  propertyId: number;
  priority?: number;
  transactionType: TransactionType;
  expenseTypeId?: number | null;
  incomeTypeId?: number | null;
  conditions: AllocationCondition[];
  isActive?: boolean;
}

// Apply allocation input
export interface ApplyAllocationInput {
  propertyId: number;
  transactionIds: number[];
}

// Reorder rules input
export interface ReorderRulesInput {
  propertyId: number;
  ruleIds: number[];
}

// Investment input
export interface InvestmentInput {
  deptFreePrice: number;
  deptShare: number;
  transferTaxPercent?: number;
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  rentPerMonth: number;
  apartmentSize?: number;
  waterCharge?: number;
  downPayment?: number;
  loanInterestPercent?: number;
  loanPeriod?: number;
  propertyId?: number;
  name?: string;
  etuoviUrl?: string;
}

// Listing import source
export type ListingSource = 'etuovi' | 'oikotie';

// Unified listing fetch input
export interface ListingFetchInput {
  url: string;
  monthlyRent?: number;
  source: ListingSource;
}

// Tax deduction input
export interface TaxDeductionInput {
  id?: number;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
  description?: string;
  amount: number;
  metadata?: TaxDeductionMetadata;
}

// Property charge input (seasonal charges with date ranges)
export interface PropertyChargeInput {
  id?: number;
  propertyId: number;
  chargeType: ChargeType;
  amount: number;
  startDate: string | null;
  endDate?: string | null;
}
