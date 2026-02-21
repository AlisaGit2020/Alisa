import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add airbnbIncomeTypeId column to the user table.
 *
 * This column stores the user's preferred income type for Airbnb statistics,
 * allowing the dashboard to calculate revenue from Airbnb visits.
 */
export class AddAirbnbIncomeTypeIdToUser1771545600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "airbnbIncomeTypeId" integer
    `);

    console.log('Added airbnbIncomeTypeId column to user table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "airbnbIncomeTypeId"
    `);

    console.log('Removed airbnbIncomeTypeId column from user table');
  }
}
