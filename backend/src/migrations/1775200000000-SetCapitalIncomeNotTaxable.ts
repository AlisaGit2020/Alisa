import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCapitalIncomeNotTaxable1775200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE income_type SET "isTaxable" = false WHERE key = 'capital-income'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE income_type SET "isTaxable" = true WHERE key = 'capital-income'
    `);
  }
}
