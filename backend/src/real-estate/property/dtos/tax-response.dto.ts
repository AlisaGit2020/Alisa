import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';

export class TaxBreakdownItemDto {
  category: string;
  amount: number;
  totalAmount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

export class IncomeBreakdownItemDto {
  category: string;
  amount: number;
  totalAmount: number;
}

export class TaxDeductionBreakdownDto {
  id: number;
  type: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  totalAmount: number;
  metadata?: TaxDeductionMetadata;
}

export class DepreciationAssetBreakdownDto {
  assetId: number;
  expenseId: number;
  description: string;
  acquisitionYear: number;
  acquisitionMonth?: number;
  originalAmount: number;
  totalOriginalAmount: number;
  depreciationAmount: number;
  totalDepreciationAmount: number;
  remainingAmount: number;
  yearsRemaining: number;
  isFullyDepreciated: boolean;
}

export class TaxResponseDto {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  totalGrossIncome: number;
  deductions: number;
  totalDeductions: number;
  taxDeductions: number = 0;
  totalTaxDeductions: number = 0;
  depreciation: number;
  totalDepreciation: number;
  netIncome: number;
  totalNetIncome: number;
  breakdown: TaxBreakdownItemDto[];
  incomeBreakdown: IncomeBreakdownItemDto[];
  taxDeductionBreakdown?: TaxDeductionBreakdownDto[];
  depreciationBreakdown?: DepreciationAssetBreakdownDto[];
  calculatedAt?: Date;
}
