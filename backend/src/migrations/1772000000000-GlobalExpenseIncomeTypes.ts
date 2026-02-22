import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to convert expense/income types from user-scoped to global types.
 *
 * WARNING: This is a breaking change that deletes all existing:
 * - Transactions
 * - Expenses
 * - Incomes
 *
 * Changes:
 * 1. Deletes all data from income, expense, transaction tables
 * 2. Drops old expense_type/income_type tables (with userId)
 * 3. Drops expense_type_default/income_type_default tables
 * 4. Removes user type preference columns
 * 5. Creates new expense_type/income_type tables with key column
 * 6. Seeds global types
 */
export class GlobalExpenseIncomeTypes1772000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Delete dependent data (order matters due to FK constraints)
    console.log('Deleting existing income, expense, and transaction data...');
    await queryRunner.query(`DELETE FROM income`);
    await queryRunner.query(`DELETE FROM expense`);
    await queryRunner.query(`DELETE FROM transaction`);

    // 2. Drop old type tables (CASCADE to handle FK constraints)
    console.log('Dropping old type tables...');
    await queryRunner.query(`DROP TABLE IF EXISTS expense_type_default CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS income_type_default CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS expense_type CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS income_type CASCADE`);

    // 3. Remove user type preference columns
    console.log('Removing user type preference columns...');
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "loanPrincipalExpenseTypeId"
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "loanInterestExpenseTypeId"
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "loanHandlingFeeExpenseTypeId"
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "airbnbIncomeTypeId"
    `);

    // 4. Create new expense_type table with key column
    console.log('Creating new expense_type table...');
    await queryRunner.query(`
      CREATE TABLE expense_type (
        id SERIAL PRIMARY KEY,
        key VARCHAR NOT NULL UNIQUE,
        "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
        "isCapitalImprovement" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // 5. Create new income_type table with key column
    console.log('Creating new income_type table...');
    await queryRunner.query(`
      CREATE TABLE income_type (
        id SERIAL PRIMARY KEY,
        key VARCHAR NOT NULL UNIQUE,
        "isTaxable" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // 6. Seed global expense types
    console.log('Seeding global expense types...');
    await queryRunner.query(`
      INSERT INTO expense_type (key, "isTaxDeductible", "isCapitalImprovement") VALUES
        ('housing-charge', true, false),
        ('maintenance-charge', true, false),
        ('financial-charge', true, false),
        ('repairs', true, false),
        ('capital-improvement', false, true),
        ('insurance', true, false),
        ('property-tax', true, false),
        ('water', true, false),
        ('electricity', true, false),
        ('rental-brokerage', true, false),
        ('loan-interest', true, false),
        ('loan-principal', false, false),
        ('loan-handling-fee', true, false)
    `);

    // 7. Seed global income types
    console.log('Seeding global income types...');
    await queryRunner.query(`
      INSERT INTO income_type (key, "isTaxable") VALUES
        ('rental', true),
        ('airbnb', true),
        ('capital-income', true),
        ('insurance-compensation', true)
    `);

    console.log('Global expense/income types migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore old user columns
    console.log('Restoring user type preference columns...');
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "loanPrincipalExpenseTypeId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "loanInterestExpenseTypeId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "loanHandlingFeeExpenseTypeId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "airbnbIncomeTypeId" integer
    `);

    // Drop global type tables
    console.log('Dropping global type tables...');
    await queryRunner.query(`DROP TABLE IF EXISTS expense_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS income_type`);

    // Recreate old tables with userId
    console.log('Recreating old type tables with userId...');
    await queryRunner.query(`
      CREATE TABLE expense_type (
        id SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
        "isCapitalImprovement" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE TABLE income_type (
        id SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "isTaxable" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE TABLE expense_type_default (
        id SERIAL PRIMARY KEY,
        "nameFi" VARCHAR NOT NULL,
        "nameEn" VARCHAR NOT NULL,
        "nameSv" VARCHAR,
        "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
        "isCapitalImprovement" BOOLEAN NOT NULL DEFAULT false,
        "loanSettingKey" VARCHAR
      )
    `);

    await queryRunner.query(`
      CREATE TABLE income_type_default (
        id SERIAL PRIMARY KEY,
        "nameFi" VARCHAR NOT NULL,
        "nameEn" VARCHAR NOT NULL,
        "nameSv" VARCHAR,
        "isTaxable" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    console.log('Rollback completed (note: data cannot be restored)');
  }
}
