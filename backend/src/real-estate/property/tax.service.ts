import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxCalculateInputDto } from './dtos/tax-calculate-input.dto';
import {
  TaxResponseDto,
  TaxBreakdownItemDto,
  IncomeBreakdownItemDto,
  DepreciationAssetBreakdownDto,
  TaxDeductionBreakdownDto,
} from './dtos/tax-response.dto';
import { StatisticKey, TransactionStatus, taxDeductionTypeNames } from '@asset-backend/common/types';
import { TaxDeduction } from './entities/tax-deduction.entity';
import { DepreciationService } from '@asset-backend/accounting/depreciation/depreciation.service';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private statisticsRepository: Repository<PropertyStatistics>,
    @InjectRepository(Ownership)
    private ownershipRepository: Repository<Ownership>,
    @InjectRepository(TaxDeduction)
    private taxDeductionRepository: Repository<TaxDeduction>,
    @Inject(forwardRef(() => PropertyService))
    private propertyService: PropertyService,
    private dataSource: DataSource,
    private depreciationService: DepreciationService,
  ) {}

  async calculate(
    user: JWTUser,
    input: TaxCalculateInputDto,
  ): Promise<TaxResponseDto> {
    const propertyIds = await this.getPropertyIds(user, input.propertyId);

    if (propertyIds.length === 0) {
      return this.emptyResponse(input.year, input.propertyId);
    }

    // Get ownership shares for all properties
    const ownershipShares = await this.getOwnershipShares(user.id, propertyIds);

    // Calculate income breakdown by type (adjusted + unadjusted)
    const {
      total: grossIncome,
      totalUnadjusted: totalGrossIncome,
      breakdown: incomeBreakdown,
    } = await this.calculateIncomeBreakdown(propertyIds, input.year, ownershipShares);

    // Calculate deductions (adjusted + unadjusted)
    const {
      total: deductions,
      totalUnadjusted: totalDeductions,
      breakdown: deductionBreakdown,
    } = await this.calculateDeductions(propertyIds, input.year, ownershipShares);

    // Calculate tax deductions (adjusted + unadjusted)
    const {
      total: taxDeductionTotal,
      totalUnadjusted: totalTaxDeductions,
      breakdown: taxDeductionBreakdown,
    } = await this.calculateTaxDeductions(propertyIds, input.year, ownershipShares);

    // Calculate depreciation using DepreciationService
    const depreciationBreakdownData =
      await this.depreciationService.getYearlyBreakdown(
        user,
        propertyIds,
        input.year,
      );

    // Apply ownership share to depreciation
    let depreciation = 0;
    let totalDepreciation = 0;
    const depreciationBreakdown: DepreciationAssetBreakdownDto[] = [];

    for (const item of depreciationBreakdownData.items) {
      const share = ownershipShares.get(item.propertyId) ?? 100;
      const shareMultiplier = share / 100;

      const adjustedDepreciationAmount = item.depreciationAmount * shareMultiplier;
      depreciation += adjustedDepreciationAmount;
      totalDepreciation += item.depreciationAmount;

      depreciationBreakdown.push({
        assetId: item.assetId,
        expenseId: item.expenseId,
        description: item.description,
        acquisitionYear: item.acquisitionYear,
        acquisitionMonth: item.acquisitionMonth,
        originalAmount: item.originalAmount * shareMultiplier,
        totalOriginalAmount: item.originalAmount,
        depreciationAmount: adjustedDepreciationAmount,
        totalDepreciationAmount: item.depreciationAmount,
        remainingAmount: item.remainingAmount * shareMultiplier,
        yearsRemaining: item.yearsRemaining,
        isFullyDepreciated: item.isFullyDepreciated,
      });
    }

    // Legacy breakdown for backward compatibility (also adjusted)
    const legacyDepreciationBreakdown = depreciationBreakdown.map((item) => ({
      category: item.description,
      amount: item.originalAmount,
      totalAmount: item.totalOriginalAmount,
      isTaxDeductible: true,
      isCapitalImprovement: true,
      depreciationAmount: item.depreciationAmount,
    }));

    // Calculate net income
    const netIncome = grossIncome - deductions - taxDeductionTotal - depreciation;
    const totalNetIncome = totalGrossIncome - totalDeductions - totalTaxDeductions - totalDepreciation;

    // Get average ownership share for display
    const ownershipShare = await this.getAverageOwnershipShare(
      user.id,
      propertyIds,
    );

    // Save to property_statistics
    await this.saveStatistics(propertyIds, input.year, {
      grossIncome,
      deductions,
      depreciation,
      netIncome,
    });

    return {
      year: input.year,
      propertyId: input.propertyId,
      ownershipShare,
      grossIncome,
      totalGrossIncome,
      deductions,
      totalDeductions,
      taxDeductions: taxDeductionTotal,
      totalTaxDeductions,
      depreciation,
      totalDepreciation,
      netIncome,
      totalNetIncome,
      breakdown: [...deductionBreakdown, ...legacyDepreciationBreakdown],
      incomeBreakdown,
      taxDeductionBreakdown,
      depreciationBreakdown,
      calculatedAt: new Date(),
    };
  }

  async get(
    user: JWTUser,
    propertyId: number | undefined,
    year: number,
  ): Promise<TaxResponseDto | null> {
    const propertyIds = await this.getPropertyIds(user, propertyId);

    if (propertyIds.length === 0) {
      return null;
    }

    // Get saved statistics
    const stats = await this.statisticsRepository.find({
      where: {
        propertyId: In(propertyIds),
        year,
        month: IsNull(),
        key: StatisticKey.TAX_GROSS_INCOME,
      },
    });

    if (stats.length === 0) {
      return null;
    }

    // Aggregate values across properties
    const allStats = await this.statisticsRepository.find({
      where: {
        propertyId: In(propertyIds),
        year,
        month: IsNull(),
      },
    });

    const grossIncome = this.sumStatsByKey(allStats, StatisticKey.TAX_GROSS_INCOME);
    const deductions = this.sumStatsByKey(allStats, StatisticKey.TAX_DEDUCTIONS);
    const depreciation = this.sumStatsByKey(allStats, StatisticKey.TAX_DEPRECIATION);

    // Get ownership shares for breakdown calculations
    const ownershipShares = await this.getOwnershipShares(user.id, propertyIds);

    // Get income breakdown (calculated live with ownership adjustment)
    const {
      totalUnadjusted: totalGrossIncome,
      breakdown: incomeBreakdown,
    } = await this.calculateIncomeBreakdown(propertyIds, year, ownershipShares);

    // Get breakdown (calculated live with ownership adjustment)
    const {
      totalUnadjusted: totalDeductions,
      breakdown: deductionBreakdown,
    } = await this.calculateDeductions(propertyIds, year, ownershipShares);

    // Get tax deduction breakdown (calculated live with ownership adjustment)
    const {
      total: taxDeductionTotal,
      totalUnadjusted: totalTaxDeductions,
      breakdown: taxDeductionBreakdown,
    } = await this.calculateTaxDeductions(propertyIds, year, ownershipShares);

    // Recalculate netIncome to include current tax deductions
    const netIncome = grossIncome - deductions - taxDeductionTotal - depreciation;

    // Get depreciation breakdown from service
    const depreciationBreakdownData =
      await this.depreciationService.getYearlyBreakdown(user, propertyIds, year);

    // Apply ownership share to depreciation breakdown
    let totalDepreciation = 0;
    const depreciationBreakdown: DepreciationAssetBreakdownDto[] = [];
    for (const item of depreciationBreakdownData.items) {
      const share = ownershipShares.get(item.propertyId) ?? 100;
      const shareMultiplier = share / 100;
      totalDepreciation += item.depreciationAmount;

      depreciationBreakdown.push({
        assetId: item.assetId,
        expenseId: item.expenseId,
        description: item.description,
        acquisitionYear: item.acquisitionYear,
        acquisitionMonth: item.acquisitionMonth,
        originalAmount: item.originalAmount * shareMultiplier,
        totalOriginalAmount: item.originalAmount,
        depreciationAmount: item.depreciationAmount * shareMultiplier,
        totalDepreciationAmount: item.depreciationAmount,
        remainingAmount: item.remainingAmount * shareMultiplier,
        yearsRemaining: item.yearsRemaining,
        isFullyDepreciated: item.isFullyDepreciated,
      });
    }

    const legacyDepreciationBreakdown = depreciationBreakdown.map((item) => ({
      category: item.description,
      amount: item.originalAmount,
      totalAmount: item.totalOriginalAmount,
      isTaxDeductible: true,
      isCapitalImprovement: true,
      depreciationAmount: item.depreciationAmount,
    }));

    const totalNetIncome = totalGrossIncome - totalDeductions - totalTaxDeductions - totalDepreciation;

    // Get average ownership share for display
    const ownershipShare = await this.getAverageOwnershipShare(
      user.id,
      propertyIds,
    );

    return {
      year,
      propertyId,
      ownershipShare,
      grossIncome,
      totalGrossIncome,
      deductions,
      totalDeductions,
      taxDeductions: taxDeductionTotal,
      totalTaxDeductions,
      depreciation,
      totalDepreciation,
      netIncome,
      totalNetIncome,
      breakdown: [...deductionBreakdown, ...legacyDepreciationBreakdown],
      incomeBreakdown,
      taxDeductionBreakdown,
      depreciationBreakdown,
    };
  }

  private async calculateIncomeBreakdown(
    propertyIds: number[],
    year: number,
    ownershipShares: Map<number, number>,
  ): Promise<{ total: number; totalUnadjusted: number; breakdown: IncomeBreakdownItemDto[] }> {
    const propertyIdsArray = `{${propertyIds.join(',')}}`;
    const result = await this.dataSource.query(
      `SELECT i."propertyId", it.key as category, COALESCE(SUM(i."totalAmount"), 0) as amount
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       INNER JOIN income_type it ON it.id = i."incomeTypeId"
       WHERE i."propertyId" = ANY($1::int[])
         AND (i."transactionId" IS NULL OR t.status = $2)
         AND EXTRACT(YEAR FROM i."accountingDate") = $3
         AND it."isTaxable" = true
       GROUP BY i."propertyId", it.id, it.key
       ORDER BY it.key`,
      [propertyIdsArray, TransactionStatus.ACCEPTED, year],
    );

    const categoryTotals = new Map<string, { adjusted: number; unadjusted: number }>();
    let totalAdjusted = 0;
    let totalUnadjusted = 0;

    for (const row of result) {
      const amount = parseFloat(row.amount) || 0;
      const share = ownershipShares.get(row.propertyId) ?? 100;
      const adjustedAmount = amount * (share / 100);

      const current = categoryTotals.get(row.category) || { adjusted: 0, unadjusted: 0 };
      categoryTotals.set(row.category, {
        adjusted: current.adjusted + adjustedAmount,
        unadjusted: current.unadjusted + amount,
      });
      totalAdjusted += adjustedAmount;
      totalUnadjusted += amount;
    }

    const breakdown: IncomeBreakdownItemDto[] = Array.from(categoryTotals.entries())
      .map(([category, amounts]) => ({
        category,
        amount: amounts.adjusted,
        totalAmount: amounts.unadjusted,
      }));

    return { total: totalAdjusted, totalUnadjusted, breakdown };
  }

  private async getPropertyIds(
    user: JWTUser,
    propertyId?: number,
  ): Promise<number[]> {
    if (propertyId) {
      // Verify user owns this property
      const property = await this.propertyService.findOne(user, propertyId);
      return property ? [propertyId] : [];
    }

    const properties = await this.propertyService.search(user, {
      select: ['id'],
    });
    return properties.map((p) => p.id);
  }

  private async calculateDeductions(
    propertyIds: number[],
    year: number,
    ownershipShares: Map<number, number>,
  ): Promise<{ total: number; totalUnadjusted: number; breakdown: TaxBreakdownItemDto[] }> {
    const propertyIdsArray = `{${propertyIds.join(',')}}`;
    const result = await this.dataSource.query(
      `SELECT
         e."propertyId",
         et.key as category,
         COALESCE(SUM(e."totalAmount"), 0) as amount
       FROM expense e
       LEFT JOIN transaction t ON t.id = e."transactionId"
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       WHERE e."propertyId" = ANY($1::int[])
         AND (e."transactionId" IS NULL OR t.status = $2)
         AND EXTRACT(YEAR FROM e."accountingDate") = $3
         AND et."isTaxDeductible" = true
         AND et."isCapitalImprovement" = false
       GROUP BY e."propertyId", et.id, et.key
       ORDER BY et.key`,
      [propertyIdsArray, TransactionStatus.ACCEPTED, year],
    );

    // Aggregate by category with ownership adjustment
    const categoryTotals = new Map<string, { adjusted: number; unadjusted: number }>();
    for (const row of result) {
      const propertyId = row.propertyId;
      const amount = parseFloat(row.amount) || 0;
      const share = ownershipShares.get(propertyId) ?? 100;
      const adjustedAmount = amount * (share / 100);

      const current = categoryTotals.get(row.category) || { adjusted: 0, unadjusted: 0 };
      categoryTotals.set(row.category, {
        adjusted: current.adjusted + adjustedAmount,
        unadjusted: current.unadjusted + amount,
      });
    }

    const breakdown: TaxBreakdownItemDto[] = Array.from(categoryTotals.entries())
      .map(([category, amounts]) => ({
        category,
        amount: amounts.adjusted,
        totalAmount: amounts.unadjusted,
        isTaxDeductible: true,
        isCapitalImprovement: false,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const totalUnadjusted = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    return { total, totalUnadjusted, breakdown };
  }

  private async calculateTaxDeductions(
    propertyIds: number[],
    year: number,
    ownershipShares: Map<number, number>,
  ): Promise<{ total: number; totalUnadjusted: number; breakdown: TaxDeductionBreakdownDto[] }> {
    const deductions = await this.taxDeductionRepository.find({
      where: {
        propertyId: In(propertyIds),
        year,
      },
    });

    let total = 0;
    let totalUnadjusted = 0;
    const breakdown: TaxDeductionBreakdownDto[] = [];

    for (const d of deductions) {
      const share = ownershipShares.get(d.propertyId) ?? 100;
      const adjustedAmount = d.amount * (share / 100);
      total += adjustedAmount;
      totalUnadjusted += d.amount;

      breakdown.push({
        id: d.id,
        type: d.deductionType,
        typeName: taxDeductionTypeNames.get(d.deductionType) ?? 'custom',
        description: d.description,
        amount: adjustedAmount,
        totalAmount: d.amount,
        metadata: d.metadata ?? undefined,
      });
    }

    return { total, totalUnadjusted, breakdown };
  }

  private async saveStatistics(
    propertyIds: number[],
    year: number,
    values: {
      grossIncome: number;
      deductions: number;
      depreciation: number;
      netIncome: number;
    },
  ): Promise<void> {
    // For simplicity, save aggregated values to the first property
    // In a more complex scenario, you might distribute or save per-property
    const propertyId = propertyIds[0];

    const stats = [
      { key: StatisticKey.TAX_GROSS_INCOME, value: values.grossIncome },
      { key: StatisticKey.TAX_DEDUCTIONS, value: values.deductions },
      { key: StatisticKey.TAX_DEPRECIATION, value: values.depreciation },
      { key: StatisticKey.TAX_NET_INCOME, value: values.netIncome },
    ];

    for (const stat of stats) {
      await this.dataSource.query(
        `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
         VALUES ($1, $2, $3, NULL, $4)
         ON CONFLICT ("propertyId", "year", "month", "key")
         DO UPDATE SET "value" = $4`,
        [propertyId, stat.key, year, stat.value.toFixed(2)],
      );
    }
  }

  private sumStatsByKey(stats: PropertyStatistics[], key: StatisticKey): number {
    return stats
      .filter((s) => s.key === key)
      .reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
  }

  private emptyResponse(year: number, propertyId?: number): TaxResponseDto {
    return {
      year,
      propertyId,
      grossIncome: 0,
      totalGrossIncome: 0,
      deductions: 0,
      totalDeductions: 0,
      taxDeductions: 0,
      totalTaxDeductions: 0,
      depreciation: 0,
      totalDepreciation: 0,
      netIncome: 0,
      totalNetIncome: 0,
      breakdown: [],
      incomeBreakdown: [],
      taxDeductionBreakdown: [],
      depreciationBreakdown: [],
    };
  }

  private async getOwnershipShares(
    userId: number,
    propertyIds: number[],
  ): Promise<Map<number, number>> {
    const ownerships = await this.ownershipRepository.find({
      where: {
        userId,
        propertyId: In(propertyIds),
      },
    });

    const sharesMap = new Map<number, number>();
    for (const ownership of ownerships) {
      sharesMap.set(ownership.propertyId, ownership.share);
    }
    return sharesMap;
  }

  private async getAverageOwnershipShare(
    userId: number,
    propertyIds: number[],
  ): Promise<number> {
    if (propertyIds.length === 0) return 100;

    const sharesMap = await this.getOwnershipShares(userId, propertyIds);
    let totalShare = 0;
    for (const propertyId of propertyIds) {
      totalShare += sharesMap.get(propertyId) ?? 100;
    }
    return totalShare / propertyIds.length;
  }
}
