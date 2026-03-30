import { TaxDeductionMetadata, TaxDeductionType } from '@asset-backend/common/types';

export class TaxBreakdownItemDto {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

export class TaxDeductionBreakdownDto {
  id: number;
  type: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: TaxDeductionMetadata;
}

export class DepreciationAssetBreakdownDto {
  assetId: number;
  expenseId: number;
  description: string;
  acquisitionYear: number;
  acquisitionMonth?: number;
  originalAmount: number;
  depreciationAmount: number;
  remainingAmount: number;
  yearsRemaining: number;
  isFullyDepreciated: boolean;
}

export class TaxResponseDto {
  year: number;
  propertyId?: number;
  ownershipShare?: number;
  grossIncome: number;
  deductions: number;
  taxDeductions: number = 0;
  depreciation: number;
  netIncome: number;
  breakdown: TaxBreakdownItemDto[];
  taxDeductionBreakdown?: TaxDeductionBreakdownDto[];
  depreciationBreakdown?: DepreciationAssetBreakdownDto[];
  calculatedAt?: Date;
}
