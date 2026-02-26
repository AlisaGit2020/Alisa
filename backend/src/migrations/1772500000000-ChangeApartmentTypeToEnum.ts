import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeApartmentTypeToEnum1772500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add temporary column for the new integer type
    await queryRunner.query(
      `ALTER TABLE "property" ADD "apartmentTypeNew" integer`,
    );

    // Convert existing Finnish string values to enum integers
    // PropertyType: APARTMENT=1, ROW_HOUSE=2, SEMI_DETACHED=3, DETACHED=4, SEPARATE_HOUSE=5, GALLERY_ACCESS=6, WOODEN_HOUSE=7
    await queryRunner.query(`
      UPDATE "property"
      SET "apartmentTypeNew" = CASE
        WHEN "apartmentType" = 'Kerrostalo' THEN 1
        WHEN "apartmentType" = 'Rivitalo' THEN 2
        WHEN "apartmentType" = 'Paritalo' THEN 3
        WHEN "apartmentType" = 'Omakotitalo' THEN 4
        WHEN "apartmentType" = 'Erillistalo' THEN 5
        WHEN "apartmentType" = 'Luhtitalo' THEN 6
        WHEN "apartmentType" = 'Puutalo-osake' THEN 7
        ELSE NULL
      END
      WHERE "apartmentType" IS NOT NULL
    `);

    // Drop the old column
    await queryRunner.query(`ALTER TABLE "property" DROP COLUMN "apartmentType"`);

    // Rename the new column
    await queryRunner.query(
      `ALTER TABLE "property" RENAME COLUMN "apartmentTypeNew" TO "apartmentType"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add temporary column for the string type
    await queryRunner.query(
      `ALTER TABLE "property" ADD "apartmentTypeOld" character varying`,
    );

    // Convert enum integers back to Finnish strings
    await queryRunner.query(`
      UPDATE "property"
      SET "apartmentTypeOld" = CASE
        WHEN "apartmentType" = 1 THEN 'Kerrostalo'
        WHEN "apartmentType" = 2 THEN 'Rivitalo'
        WHEN "apartmentType" = 3 THEN 'Paritalo'
        WHEN "apartmentType" = 4 THEN 'Omakotitalo'
        WHEN "apartmentType" = 5 THEN 'Erillistalo'
        WHEN "apartmentType" = 6 THEN 'Luhtitalo'
        WHEN "apartmentType" = 7 THEN 'Puutalo-osake'
        ELSE NULL
      END
      WHERE "apartmentType" IS NOT NULL
    `);

    // Drop the new column
    await queryRunner.query(`ALTER TABLE "property" DROP COLUMN "apartmentType"`);

    // Rename back to original
    await queryRunner.query(
      `ALTER TABLE "property" RENAME COLUMN "apartmentTypeOld" TO "apartmentType"`,
    );
  }
}
