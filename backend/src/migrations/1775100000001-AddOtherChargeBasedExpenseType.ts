import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add new expense type: other-charge-based.
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING to safely handle:
 * - Fresh databases (seeder already ran with all types)
 * - Existing databases (missing new types)
 */
export class AddOtherChargeBasedExpenseType1775100000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding other-charge-based expense type...');

    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
      VALUES ('other-charge-based', true, false)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing other-charge-based expense type...');

    await queryRunner.query(`
      DELETE FROM expense_type WHERE key = 'other-charge-based'
    `);

    console.log('Rollback completed');
  }
}
