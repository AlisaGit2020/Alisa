import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDistrictToAddress1772600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add district column to address table
    await queryRunner.query(
      `ALTER TABLE "address" ADD "district" character varying NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove district column from address table
    await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "district"`);
  }
}
