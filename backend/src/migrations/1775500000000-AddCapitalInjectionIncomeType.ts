import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCapitalInjectionIncomeType1775500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO income_type (key, "isTaxable")
      VALUES ('capital-injection', false)
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM income_type WHERE key = 'capital-injection'
    `);
  }
}
