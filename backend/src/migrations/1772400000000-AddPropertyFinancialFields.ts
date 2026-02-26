import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyFinancialFields1772400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add financial fields for property investment calculations
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "debtShare" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "maintenanceFee" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "financialCharge" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "monthlyRent" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "waterCharge" decimal(12,2) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "waterCharge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "monthlyRent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "financialCharge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "maintenanceFee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "debtShare"`,
    );
  }
}
