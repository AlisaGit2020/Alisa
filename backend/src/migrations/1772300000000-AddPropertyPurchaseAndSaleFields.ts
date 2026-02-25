import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyPurchaseAndSaleFields1772300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add rooms field (string, nullable)
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "rooms" varchar NULL`,
    );

    // Add purchase-related fields
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "purchasePrice" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "purchaseDate" date NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "purchaseLoan" decimal(12,2) NULL`,
    );

    // Add sale-related fields
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "salePrice" decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "saleDate" date NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "saleDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "salePrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "purchaseLoan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "purchaseDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "purchasePrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN IF EXISTS "rooms"`,
    );
  }
}
