import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { JWTUser } from '@alisa-backend/auth/types';
import { TaxCalculateInputDto } from './dtos/tax-calculate-input.dto';
import {
  TaxResponseDto,
  TaxBreakdownItemDto,
  DepreciationAssetBreakdownDto,
} from './dtos/tax-response.dto';
import { StatisticKey, TransactionStatus } from '@alisa-backend/common/types';
import { DepreciationService } from '@alisa-backend/accounting/depreciation/depreciation.service';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private statisticsRepository: Repository<PropertyStatistics>,
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

    // Calculate gross income
    const grossIncome = await this.calculateGrossIncome(propertyIds, input.year);

    // Calculate deductions (tax deductible, not capital improvements)
    const { total: deductions, breakdown: deductionBreakdown } =
      await this.calculateDeductions(propertyIds, input.year);

    // Calculate depreciation using DepreciationService
    const depreciationBreakdownData = await this.depreciationService.getYearlyBreakdown(
      user,
      propertyIds,
      input.year,
    );

    const depreciation = depreciationBreakdownData.totalDepreciation;

    // Convert to DTO format
    const depreciationBreakdown: DepreciationAssetBreakdownDto[] =
      depreciationBreakdownData.items.map((item) => ({
        assetId: item.assetId,
        expenseId: item.expenseId,
        description: item.description,
        acquisitionYear: item.acquisitionYear,
        acquisitionMonth: item.acquisitionMonth,
        originalAmount: item.originalAmount,
        depreciationAmount: item.depreciationAmount,
        remainingAmount: item.remainingAmount,
        yearsRemaining: item.yearsRemaining,
        isFullyDepreciated: item.isFullyDepreciated,
      }));

    // Legacy breakdown for backward compatibility
    const legacyDepreciationBreakdown = this.convertToLegacyBreakdown(
      depreciationBreakdownData.items,
    );

    // Calculate net income
    const netIncome = grossIncome - deductions - depreciation;

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
      grossIncome,
      deductions,
      depreciation,
      netIncome,
      breakdown: [...deductionBreakdown, ...legacyDepreciationBreakdown],
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
    const netIncome = this.sumStatsByKey(allStats, StatisticKey.TAX_NET_INCOME);

    // Get breakdown (calculated live)
    const { breakdown: deductionBreakdown } = await this.calculateDeductions(
      propertyIds,
      year,
    );

    // Get depreciation breakdown from service
    const depreciationBreakdownData = await this.depreciationService.getYearlyBreakdown(
      user,
      propertyIds,
      year,
    );

    const depreciationBreakdown: DepreciationAssetBreakdownDto[] =
      depreciationBreakdownData.items.map((item) => ({
        assetId: item.assetId,
        expenseId: item.expenseId,
        description: item.description,
        acquisitionYear: item.acquisitionYear,
        acquisitionMonth: item.acquisitionMonth,
        originalAmount: item.originalAmount,
        depreciationAmount: item.depreciationAmount,
        remainingAmount: item.remainingAmount,
        yearsRemaining: item.yearsRemaining,
        isFullyDepreciated: item.isFullyDepreciated,
      }));

    const legacyDepreciationBreakdown = this.convertToLegacyBreakdown(
      depreciationBreakdownData.items,
    );

    return {
      year,
      propertyId,
      grossIncome,
      deductions,
      depreciation,
      netIncome,
      breakdown: [...deductionBreakdown, ...legacyDepreciationBreakdown],
      depreciationBreakdown,
    };
  }

  private convertToLegacyBreakdown(
    items: { description: string; originalAmount: number; depreciationAmount: number }[],
  ): TaxBreakdownItemDto[] {
    return items.map((item) => ({
      category: item.description,
      amount: item.originalAmount,
      isTaxDeductible: true,
      isCapitalImprovement: true,
      depreciationAmount: item.depreciationAmount,
    }));
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

  private async calculateGrossIncome(
    propertyIds: number[],
    year: number,
  ): Promise<number> {
    const propertyIdsArray = `{${propertyIds.join(',')}}`;
    const result = await this.dataSource.query(
      `SELECT COALESCE(SUM(i."totalAmount"), 0) as total
       FROM income i
       LEFT JOIN transaction t ON t.id = i."transactionId"
       WHERE i."propertyId" = ANY($1::int[])
         AND (i."transactionId" IS NULL OR t.status = $2)
         AND EXTRACT(YEAR FROM i."accountingDate") = $3`,
      [propertyIdsArray, TransactionStatus.ACCEPTED, year],
    );
    return parseFloat(result[0]?.total) || 0;
  }

  private async calculateDeductions(
    propertyIds: number[],
    year: number,
  ): Promise<{ total: number; breakdown: TaxBreakdownItemDto[] }> {
    const propertyIdsArray = `{${propertyIds.join(',')}}`;
    const result = await this.dataSource.query(
      `SELECT
         et.name as category,
         COALESCE(SUM(e."totalAmount"), 0) as amount
       FROM expense e
       LEFT JOIN transaction t ON t.id = e."transactionId"
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       WHERE e."propertyId" = ANY($1::int[])
         AND (e."transactionId" IS NULL OR t.status = $2)
         AND EXTRACT(YEAR FROM e."accountingDate") = $3
         AND et."isTaxDeductible" = true
         AND et."isCapitalImprovement" = false
       GROUP BY et.id, et.name
       ORDER BY et.name`,
      [propertyIdsArray, TransactionStatus.ACCEPTED, year],
    );

    const breakdown: TaxBreakdownItemDto[] = result.map((row: { category: string; amount: string }) => ({
      category: row.category,
      amount: parseFloat(row.amount) || 0,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    }));

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return { total, breakdown };
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
      deductions: 0,
      depreciation: 0,
      netIncome: 0,
      breakdown: [],
      depreciationBreakdown: [],
    };
  }
}
