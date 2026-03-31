import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStartDateNullableAndDropPropertyChargeFields1775100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make startDate nullable in property_charge
    await queryRunner.query(`
      ALTER TABLE property_charge
      ALTER COLUMN "startDate" DROP NOT NULL
    `);

    // Drop charge columns from property table
    await queryRunner.query(`
      ALTER TABLE property
      DROP COLUMN IF EXISTS "maintenanceFee",
      DROP COLUMN IF EXISTS "financialCharge",
      DROP COLUMN IF EXISTS "waterCharge"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore charge columns to property table
    await queryRunner.query(`
      ALTER TABLE property
      ADD COLUMN IF NOT EXISTS "maintenanceFee" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "financialCharge" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "waterCharge" DECIMAL(12,2)
    `);

    // Make startDate NOT NULL again (set nulls to epoch first)
    await queryRunner.query(`
      UPDATE property_charge
      SET "startDate" = '1970-01-01'
      WHERE "startDate" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE property_charge
      ALTER COLUMN "startDate" SET NOT NULL
    `);
  }
}
