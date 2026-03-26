import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add new expense and income types:
 * - furnishings: furniture, appliances, and household items
 * - consumables: toilet paper, soap, cleaning supplies, etc.
 * - cleaning-fee: income from Airbnb cleaning fees
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING to safely handle:
 * - Fresh databases (seeder already ran with all types)
 * - Existing databases (missing new types)
 */
export class AddFurniturePurchasesExpenseType1772200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding furnishings and consumables expense types...');

    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
      VALUES
        ('furnishings', true, false),
        ('consumables', true, false)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Adding cleaning-fee income type...');

    await queryRunner.query(`
      INSERT INTO income_type (key, "isTaxable")
      VALUES
        ('cleaning-fee', true)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing furnishings and consumables expense types...');

    await queryRunner.query(`
      DELETE FROM expense_type WHERE key IN ('furnishings', 'consumables')
    `);

    console.log('Removing cleaning-fee income type...');

    await queryRunner.query(`
      DELETE FROM income_type WHERE key = 'cleaning-fee'
    `);

    console.log('Rollback completed');
  }
}
