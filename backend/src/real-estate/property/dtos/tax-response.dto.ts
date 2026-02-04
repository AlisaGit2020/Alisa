export class TaxBreakdownItemDto {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
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
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: TaxBreakdownItemDto[];
  depreciationBreakdown?: DepreciationAssetBreakdownDto[];
  calculatedAt?: Date;
}
