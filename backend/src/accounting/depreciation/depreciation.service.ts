import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { DepreciationAsset } from './entities/depreciation-asset.entity';
import { DepreciationRecord } from './entities/depreciation-record.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  DepreciationBreakdownDto,
  DepreciationBreakdownItemDto,
} from './dtos/depreciation-breakdown.dto';
import { TransactionStatus } from '@alisa-backend/common/types';

@Injectable()
export class DepreciationService {
  private readonly logger = new Logger(DepreciationService.name);
  // Finnish tax rules: 10% annual depreciation, max 10 years
  private readonly DEPRECIATION_RATE = 0.1;
  private readonly MAX_DEPRECIATION_YEARS = 10;

  constructor(
    @InjectRepository(DepreciationAsset)
    private assetRepository: Repository<DepreciationAsset>,
    @InjectRepository(DepreciationRecord)
    private recordRepository: Repository<DepreciationRecord>,
    private authService: AuthService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a depreciation asset from a capital improvement expense
   */
  async createFromExpense(expense: Expense): Promise<DepreciationAsset> {
    // Check if asset already exists for this expense
    const existing = await this.assetRepository.findOne({
      where: { expenseId: expense.id },
    });
    if (existing) {
      return existing;
    }

    const accountingDate = new Date(expense.accountingDate);

    const asset = new DepreciationAsset();
    asset.expenseId = expense.id;
    asset.propertyId = expense.propertyId;
    asset.originalAmount = Math.abs(expense.totalAmount);
    asset.acquisitionYear = accountingDate.getFullYear();
    asset.acquisitionMonth = accountingDate.getMonth() + 1;
    asset.remainingAmount = Math.abs(expense.totalAmount);
    asset.isFullyDepreciated = false;
    asset.description = expense.description;

    return await this.assetRepository.save(asset);
  }

  /**
   * Delete depreciation asset when expense is deleted
   */
  async deleteByExpenseId(expenseId: number): Promise<void> {
    await this.assetRepository.delete({ expenseId });
  }

  /**
   * Calculate annual depreciation for an asset in a given year
   * Returns 0 if:
   * - Asset is fully depreciated
   * - Year is before acquisition
   * - More than 10 years have passed since acquisition
   */
  calculateAnnualDepreciation(
    asset: DepreciationAsset,
    year: number,
  ): number {
    // No depreciation if already fully depreciated
    if (asset.isFullyDepreciated || asset.remainingAmount <= 0) {
      return 0;
    }

    // No depreciation before acquisition year
    if (year < asset.acquisitionYear) {
      return 0;
    }

    // No depreciation after 10 years
    const yearsElapsed = year - asset.acquisitionYear;
    if (yearsElapsed >= this.MAX_DEPRECIATION_YEARS) {
      return 0;
    }

    // 10% of original amount, but not more than remaining
    const annualAmount = asset.originalAmount * this.DEPRECIATION_RATE;
    return Math.min(annualAmount, asset.remainingAmount);
  }

  /**
   * Get all depreciation assets for given properties
   */
  async getAssets(
    user: JWTUser,
    propertyIds: number[],
  ): Promise<DepreciationAsset[]> {
    if (propertyIds.length === 0) {
      return [];
    }

    return await this.assetRepository.find({
      where: {
        propertyId: In(propertyIds),
      },
      order: {
        acquisitionYear: 'ASC',
        id: 'ASC',
      },
    });
  }

  /**
   * Ensure all capital improvement expenses have DepreciationAssets
   * This handles migration of existing expenses
   */
  async ensureAssetsForCapitalImprovements(
    propertyIds: number[],
  ): Promise<number> {
    if (propertyIds.length === 0) {
      return 0;
    }

    const propertyIdsArray = `{${propertyIds.join(',')}}`;

    // Find capital improvement expenses without DepreciationAsset
    const expensesWithoutAssets = await this.dataSource.query(
      `SELECT e.id, e.description, e."totalAmount", e."accountingDate", e."propertyId"
       FROM expense e
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       LEFT JOIN transaction t ON t.id = e."transactionId"
       LEFT JOIN depreciation_asset da ON da."expenseId" = e.id
       WHERE e."propertyId" = ANY($1::int[])
         AND et."isCapitalImprovement" = true
         AND da.id IS NULL
         AND (e."transactionId" IS NULL OR t.status = $2)`,
      [propertyIdsArray, TransactionStatus.ACCEPTED],
    );

    let created = 0;
    for (const expense of expensesWithoutAssets) {
      try {
        const accountingDate = new Date(expense.accountingDate);
        const originalAmount = Math.abs(parseFloat(expense.totalAmount));

        const asset = new DepreciationAsset();
        asset.expenseId = expense.id;
        asset.propertyId = expense.propertyId;
        asset.originalAmount = originalAmount;
        asset.acquisitionYear = accountingDate.getFullYear();
        asset.acquisitionMonth = accountingDate.getMonth() + 1;
        asset.remainingAmount = originalAmount;
        asset.isFullyDepreciated = false;
        asset.description = expense.description;

        await this.assetRepository.save(asset);
        created++;
        this.logger.log(`Created DepreciationAsset for expense ${expense.id}: ${expense.description}`);
      } catch (error) {
        this.logger.error(`Failed to create DepreciationAsset for expense ${expense.id}: ${error.message}`);
      }
    }

    return created;
  }

  /**
   * Get depreciation breakdown for tax reporting
   * Shows each asset with its depreciation for the specified year
   */
  async getYearlyBreakdown(
    user: JWTUser,
    propertyIds: number[],
    year: number,
  ): Promise<DepreciationBreakdownDto> {
    // Ensure all capital improvements have DepreciationAssets (handles migration)
    await this.ensureAssetsForCapitalImprovements(propertyIds);

    const assets = await this.getAssets(user, propertyIds);

    const items: DepreciationBreakdownItemDto[] = [];
    let totalDepreciation = 0;

    for (const asset of assets) {
      const depreciationAmount = this.calculateAnnualDepreciation(asset, year);

      // Calculate years remaining (for display)
      const yearsElapsed = year - asset.acquisitionYear;
      const yearsRemaining = Math.max(
        0,
        this.MAX_DEPRECIATION_YEARS - yearsElapsed - 1,
      );

      // Calculate remaining amount after this year's depreciation
      const remainingAfter = Math.max(0, asset.remainingAmount - depreciationAmount);

      // Only include assets that have depreciation this year or are within 10-year window
      if (
        depreciationAmount > 0 ||
        (yearsElapsed >= 0 && yearsElapsed < this.MAX_DEPRECIATION_YEARS)
      ) {
        items.push({
          assetId: asset.id,
          expenseId: asset.expenseId,
          propertyId: asset.propertyId,
          description: asset.description,
          acquisitionYear: asset.acquisitionYear,
          acquisitionMonth: asset.acquisitionMonth,
          originalAmount: asset.originalAmount,
          depreciationAmount,
          remainingAmount: remainingAfter,
          yearsRemaining,
          isFullyDepreciated: asset.isFullyDepreciated || remainingAfter <= 0,
        });

        totalDepreciation += depreciationAmount;
      }
    }

    return {
      year,
      propertyId: propertyIds.length === 1 ? propertyIds[0] : undefined,
      items,
      totalDepreciation,
    };
  }

  /**
   * Process and record yearly depreciation for assets
   * This updates the remainingAmount and creates DepreciationRecords
   */
  async processYearlyDepreciation(
    user: JWTUser,
    propertyIds: number[],
    year: number,
  ): Promise<void> {
    const assets = await this.getAssets(user, propertyIds);

    for (const asset of assets) {
      // Check if already processed for this year
      const existingRecord = await this.recordRepository.findOne({
        where: {
          depreciationAssetId: asset.id,
          year,
        },
      });

      if (existingRecord) {
        continue; // Already processed
      }

      const depreciationAmount = this.calculateAnnualDepreciation(asset, year);

      if (depreciationAmount > 0) {
        const remainingAfter = asset.remainingAmount - depreciationAmount;

        // Create depreciation record
        const record = new DepreciationRecord();
        record.depreciationAssetId = asset.id;
        record.year = year;
        record.amount = depreciationAmount;
        record.remainingAfter = remainingAfter;
        await this.recordRepository.save(record);

        // Update asset
        asset.remainingAmount = remainingAfter;
        if (remainingAfter <= 0) {
          asset.isFullyDepreciated = true;
        }
        await this.assetRepository.save(asset);
      }
    }
  }

  /**
   * Get asset by expense ID
   */
  async getByExpenseId(expenseId: number): Promise<DepreciationAsset | null> {
    return await this.assetRepository.findOne({
      where: { expenseId },
    });
  }

  /**
   * Update asset when expense is updated
   */
  async updateFromExpense(expense: Expense): Promise<DepreciationAsset | null> {
    const asset = await this.getByExpenseId(expense.id);
    if (!asset) {
      return null;
    }

    const accountingDate = new Date(expense.accountingDate);
    const newAmount = Math.abs(expense.totalAmount);
    const amountDiff = newAmount - asset.originalAmount;

    asset.originalAmount = newAmount;
    asset.acquisitionYear = accountingDate.getFullYear();
    asset.acquisitionMonth = accountingDate.getMonth() + 1;
    asset.description = expense.description;

    // Adjust remaining amount proportionally
    asset.remainingAmount = Math.max(0, asset.remainingAmount + amountDiff);
    asset.isFullyDepreciated = asset.remainingAmount <= 0;

    return await this.assetRepository.save(asset);
  }
}
