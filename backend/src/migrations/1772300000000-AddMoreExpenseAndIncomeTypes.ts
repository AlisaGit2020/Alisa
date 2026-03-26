import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add additional expense and income types that were added
 * after the initial 1772200000000 migration was deployed.
 */
export class AddMoreExpenseAndIncomeTypes1772300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding additional expense types...');

    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement")
      VALUES
        ('rental-operations', true, false),
        ('rent-refund', true, false),
        ('internet', true, false)
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
    await queryRunner.query(`
      DELETE FROM expense_type WHERE key IN ('rental-operations', 'rent-refund', 'internet')
    `);

    await queryRunner.query(`
      DELETE FROM income_type WHERE key = 'cleaning-fee'
    `);
  }
}
