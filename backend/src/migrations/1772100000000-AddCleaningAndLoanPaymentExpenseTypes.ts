import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add new expense types: loan-payment and cleaning.
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING to safely handle:
 * - Fresh databases (seeder already ran with all types)
 * - Existing databases (missing new types)
 */
export class AddCleaningAndLoanPaymentExpenseTypes1772100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding loan-payment and cleaning expense types...');

    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
      VALUES
        ('loan-payment', false, false),
        ('cleaning', true, false)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Expense types migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing loan-payment and cleaning expense types...');

    await queryRunner.query(`
      DELETE FROM expense_type WHERE key IN ('loan-payment', 'cleaning')
    `);

    console.log('Rollback completed');
  }
}
