import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add new expense types:
 * - furnishings: furniture, appliances, and household items
 * - consumables: toilet paper, soap, cleaning supplies, etc.
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

    console.log('Migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing furnishings and consumables expense types...');

    await queryRunner.query(`
      DELETE FROM expense_type WHERE key IN ('furnishings', 'consumables')
    `);

    console.log('Rollback completed');
  }
}
