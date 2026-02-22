import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the allocation_rule table for automated transaction categorization.
 *
 * Allocation rules allow users to define patterns that automatically assign
 * transaction types and expense/income categories during import.
 */
export class CreateAllocationRuleTable1772050000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating allocation_rule table...');

    await queryRunner.query(`
      CREATE TABLE allocation_rule (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "propertyId" INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
        priority INTEGER NOT NULL DEFAULT 0,
        "transactionType" SMALLINT NOT NULL,
        "expenseTypeId" INTEGER REFERENCES expense_type(id) ON DELETE SET NULL,
        "incomeTypeId" INTEGER REFERENCES income_type(id) ON DELETE SET NULL,
        conditions JSONB NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Index for efficient lookup by property
    await queryRunner.query(`
      CREATE INDEX idx_allocation_rule_property_id ON allocation_rule("propertyId")
    `);

    console.log('allocation_rule table created');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping allocation_rule table...');

    await queryRunner.query(`DROP TABLE IF EXISTS allocation_rule`);

    console.log('allocation_rule table dropped');
  }
}
