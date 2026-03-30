import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the tax_deduction table for storing tax-only deductions
 * and add Airbnb-related fields to the property table.
 *
 * Tax deductions are separate from accounting expenses and only affect tax calculations.
 * Examples include travel compensation and laundry costs for Airbnb properties.
 */
export class CreateTaxDeductionTable1774855400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding Airbnb fields to property table...');

    // Add Airbnb fields to property table
    await queryRunner.query(`
      ALTER TABLE property
      ADD COLUMN IF NOT EXISTS "isAirbnb" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "distanceFromHome" DECIMAL(6,1) NULL
    `);

    console.log('Creating tax_deduction table...');

    // Create tax_deduction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tax_deduction (
        id SERIAL PRIMARY KEY,
        "propertyId" INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
        year SMALLINT NOT NULL,
        "deductionType" SMALLINT NOT NULL,
        description VARCHAR(255),
        amount DECIMAL(12,2) NOT NULL,
        metadata JSONB
      )
    `);

    // Create index for efficient queries by property and year
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tax_deduction_property_year
      ON tax_deduction("propertyId", year)
    `);

    console.log('tax_deduction table created');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping tax_deduction table...');

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tax_deduction_property_year`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS tax_deduction`);

    console.log('Removing Airbnb fields from property table...');

    await queryRunner.query(`
      ALTER TABLE property
      DROP COLUMN IF EXISTS "distanceFromHome",
      DROP COLUMN IF EXISTS "isAirbnb"
    `);

    console.log('Migration reverted');
  }
}
