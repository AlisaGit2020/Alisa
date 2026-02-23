import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DepreciationAsset } from './entities/depreciation-asset.entity';
import { DepreciationRecord } from './entities/depreciation-record.entity';
import { TransactionStatus } from '@asset-backend/common/types';

interface MigrationResult {
  assetsCreated: number;
  recordsCreated: number;
  errors: string[];
}

@Injectable()
export class DepreciationMigrationService {
  private readonly logger = new Logger(DepreciationMigrationService.name);
  private readonly DEPRECIATION_RATE = 0.1;
  private readonly MAX_DEPRECIATION_YEARS = 10;

  constructor(
    @InjectRepository(DepreciationAsset)
    private assetRepository: Repository<DepreciationAsset>,
    @InjectRepository(DepreciationRecord)
    private recordRepository: Repository<DepreciationRecord>,
    private dataSource: DataSource,
  ) {}

  /**
   * Migrate existing capital improvement expenses to DepreciationAssets
   * Creates historical DepreciationRecords for past years
   */
  async migrateExistingCapitalImprovements(
    currentYear: number,
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      assetsCreated: 0,
      recordsCreated: 0,
      errors: [],
    };

    // Find all capital improvement expenses that don't have a DepreciationAsset
    const capitalImprovements = await this.dataSource.query(
      `SELECT e.id, e.description, e."totalAmount", e."accountingDate", e."propertyId"
       FROM expense e
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       LEFT JOIN transaction t ON t.id = e."transactionId"
       LEFT JOIN depreciation_asset da ON da."expenseId" = e.id
       WHERE et."isCapitalImprovement" = true
         AND da.id IS NULL
         AND (e."transactionId" IS NULL OR t.status = $1)
       ORDER BY e."accountingDate" ASC`,
      [TransactionStatus.ACCEPTED],
    );

    this.logger.log(
      `Found ${capitalImprovements.length} capital improvements to migrate`,
    );

    for (const expense of capitalImprovements) {
      try {
        const asset = await this.createAssetFromExpenseData(expense, currentYear);
        result.assetsCreated++;

        // Create historical depreciation records
        const recordsCreated = await this.createHistoricalRecords(
          asset,
          currentYear,
        );
        result.recordsCreated += recordsCreated;
      } catch (error) {
        const errorMsg = `Failed to migrate expense ${expense.id}: ${error.message}`;
        this.logger.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    this.logger.log(
      `Migration complete: ${result.assetsCreated} assets created, ${result.recordsCreated} records created`,
    );

    return result;
  }

  private async createAssetFromExpenseData(
    expense: {
      id: number;
      description: string;
      totalAmount: string;
      accountingDate: Date;
      propertyId: number;
    },
    currentYear: number,
  ): Promise<DepreciationAsset> {
    const accountingDate = new Date(expense.accountingDate);
    const acquisitionYear = accountingDate.getFullYear();
    const originalAmount = Math.abs(parseFloat(expense.totalAmount));

    // Calculate how much has been depreciated historically
    const yearsElapsed = Math.min(
      currentYear - acquisitionYear,
      this.MAX_DEPRECIATION_YEARS,
    );
    const totalDepreciated = Math.min(
      originalAmount * this.DEPRECIATION_RATE * Math.max(0, yearsElapsed),
      originalAmount,
    );
    const remainingAmount = originalAmount - totalDepreciated;
    const isFullyDepreciated = remainingAmount <= 0;

    const asset = new DepreciationAsset();
    asset.expenseId = expense.id;
    asset.propertyId = expense.propertyId;
    asset.originalAmount = originalAmount;
    asset.acquisitionYear = acquisitionYear;
    asset.acquisitionMonth = accountingDate.getMonth() + 1;
    asset.remainingAmount = Math.max(0, remainingAmount);
    asset.isFullyDepreciated = isFullyDepreciated;
    asset.description = expense.description;

    return await this.assetRepository.save(asset);
  }

  private async createHistoricalRecords(
    asset: DepreciationAsset,
    currentYear: number,
  ): Promise<number> {
    let recordsCreated = 0;
    let remaining = asset.originalAmount;
    const annualAmount = asset.originalAmount * this.DEPRECIATION_RATE;

    // Create records for each year from acquisition to current year (exclusive)
    for (let year = asset.acquisitionYear; year < currentYear; year++) {
      const yearsElapsed = year - asset.acquisitionYear;

      // Stop if we've exceeded 10 years
      if (yearsElapsed >= this.MAX_DEPRECIATION_YEARS) {
        break;
      }

      // Stop if fully depreciated
      if (remaining <= 0) {
        break;
      }

      const depreciation = Math.min(annualAmount, remaining);
      remaining -= depreciation;

      const record = new DepreciationRecord();
      record.depreciationAssetId = asset.id;
      record.year = year;
      record.amount = depreciation;
      record.remainingAfter = remaining;
      record.calculatedAt = new Date();

      await this.recordRepository.save(record);
      recordsCreated++;
    }

    return recordsCreated;
  }

  /**
   * Check migration status
   */
  async getMigrationStatus(): Promise<{
    totalCapitalImprovements: number;
    migratedAssets: number;
    unmigrated: number;
  }> {
    const result = await this.dataSource.query(
      `SELECT
         COUNT(DISTINCT e.id) as total,
         COUNT(DISTINCT da.id) as migrated
       FROM expense e
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       LEFT JOIN depreciation_asset da ON da."expenseId" = e.id
       WHERE et."isCapitalImprovement" = true`,
    );

    const total = parseInt(result[0]?.total) || 0;
    const migrated = parseInt(result[0]?.migrated) || 0;

    return {
      totalCapitalImprovements: total,
      migratedAssets: migrated,
      unmigrated: total - migrated,
    };
  }
}
