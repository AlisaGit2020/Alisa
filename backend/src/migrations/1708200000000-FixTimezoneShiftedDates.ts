import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to fix dates that were incorrectly stored due to timezone shift.
 *
 * Problem: When users in UTC+2 (Finland) selected a date like 01.01.2025,
 * the frontend sent it as 2024-12-31T22:00:00Z, which was stored as-is.
 * This caused transactions to appear in December 2024 instead of January 2025.
 *
 * Solution: For any date with UTC hour >= 22, round up to the next day at midnight.
 *
 * After running this migration, use the /statistics/recalculate endpoint
 * to recalculate all property statistics.
 */
export class FixTimezoneShiftedDates1708200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix transaction.transactionDate
    const transactionDateResult = await queryRunner.query(`
      UPDATE transaction
      SET "transactionDate" = date_trunc('day', "transactionDate" + interval '1 day')
      WHERE EXTRACT(HOUR FROM "transactionDate") >= 22
      RETURNING id
    `);
    console.log(
      `Fixed ${transactionDateResult.length} transaction.transactionDate records`,
    );

    // Fix transaction.accountingDate
    const transactionAccountingResult = await queryRunner.query(`
      UPDATE transaction
      SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
      WHERE EXTRACT(HOUR FROM "accountingDate") >= 22
      RETURNING id
    `);
    console.log(
      `Fixed ${transactionAccountingResult.length} transaction.accountingDate records`,
    );

    // Fix income.accountingDate
    const incomeResult = await queryRunner.query(`
      UPDATE income
      SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
      WHERE "accountingDate" IS NOT NULL
        AND EXTRACT(HOUR FROM "accountingDate") >= 22
      RETURNING id
    `);
    console.log(`Fixed ${incomeResult.length} income.accountingDate records`);

    // Fix expense.accountingDate
    const expenseResult = await queryRunner.query(`
      UPDATE expense
      SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
      WHERE "accountingDate" IS NOT NULL
        AND EXTRACT(HOUR FROM "accountingDate") >= 22
      RETURNING id
    `);
    console.log(`Fixed ${expenseResult.length} expense.accountingDate records`);

    console.log('');
    console.log('='.repeat(60));
    console.log('IMPORTANT: After this migration completes, you must');
    console.log('recalculate statistics for all users by calling the');
    console.log('/api/real-estate/property/statistics/recalculate endpoint');
    console.log('for each user, or run the recalculate script.');
    console.log('='.repeat(60));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be safely reverted as we don't know
    // which dates were originally shifted and which were legitimately
    // at midnight. The down migration is intentionally a no-op.
    console.log(
      'Warning: This migration cannot be reverted. Original timestamps cannot be reconstructed.',
    );
  }
}
