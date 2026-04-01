import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the property_charge table for storing seasonal charges
 * (hoitovastike, rahoitusvastike, vesi-ennakko, yhtiövastike) with date ranges.
 *
 * Also migrates existing charge data from property table to the new structure.
 */
export class CreatePropertyChargeTable1775000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating property_charge table...');

    // Create property_charge table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS property_charge (
        id SERIAL PRIMARY KEY,
        "propertyId" INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
        "chargeType" SMALLINT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NULL
      )
    `);

    // Create index for efficient queries by property
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_property_charge_property
      ON property_charge("propertyId")
    `);

    // Create index for date range queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_property_charge_dates
      ON property_charge("propertyId", "chargeType", "startDate", "endDate")
    `);

    console.log('property_charge table created');

    // Migrate existing data from property table
    console.log('Migrating existing charge data...');

    // Charge type constants:
    // MAINTENANCE_FEE = 1
    // FINANCIAL_CHARGE = 2
    // WATER_PREPAYMENT = 3
    // TOTAL_CHARGE = 4

    // Migrate maintenanceFee values
    await queryRunner.query(`
      INSERT INTO property_charge ("propertyId", "chargeType", amount, "startDate", "endDate")
      SELECT id, 1, "maintenanceFee", COALESCE("purchaseDate", '2020-01-01'), NULL
      FROM property
      WHERE "maintenanceFee" IS NOT NULL AND "maintenanceFee" > 0
    `);

    // Migrate financialCharge values
    await queryRunner.query(`
      INSERT INTO property_charge ("propertyId", "chargeType", amount, "startDate", "endDate")
      SELECT id, 2, "financialCharge", COALESCE("purchaseDate", '2020-01-01'), NULL
      FROM property
      WHERE "financialCharge" IS NOT NULL AND "financialCharge" > 0
    `);

    // Migrate waterCharge values (now waterPrepayment)
    await queryRunner.query(`
      INSERT INTO property_charge ("propertyId", "chargeType", amount, "startDate", "endDate")
      SELECT id, 3, "waterCharge", COALESCE("purchaseDate", '2020-01-01'), NULL
      FROM property
      WHERE "waterCharge" IS NOT NULL AND "waterCharge" > 0
    `);

    // Calculate and insert TOTAL_CHARGE for migrated data
    await queryRunner.query(`
      INSERT INTO property_charge ("propertyId", "chargeType", amount, "startDate", "endDate")
      SELECT
        p.id,
        4,
        COALESCE(p."maintenanceFee", 0) + COALESCE(p."financialCharge", 0) + COALESCE(p."waterCharge", 0),
        COALESCE(p."purchaseDate", '2020-01-01'),
        NULL
      FROM property p
      WHERE (p."maintenanceFee" IS NOT NULL AND p."maintenanceFee" > 0)
         OR (p."financialCharge" IS NOT NULL AND p."financialCharge" > 0)
         OR (p."waterCharge" IS NOT NULL AND p."waterCharge" > 0)
    `);

    console.log('Migration complete');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping property_charge table...');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_property_charge_dates`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_property_charge_property`);
    await queryRunner.query(`DROP TABLE IF EXISTS property_charge`);

    console.log('Migration reverted');
  }
}