import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCleaningManagement1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add roles column to user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "roles" text[] NOT NULL DEFAULT '{owner}'`,
    );

    // 2. Migrate isAdmin data
    await queryRunner.query(
      `UPDATE "user" SET "roles" = '{admin,owner}' WHERE "isAdmin" = true`,
    );

    // 3. Drop isAdmin column
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "isAdmin"`,
    );

    // 4. Add cleaningBruttoPrice to property
    await queryRunner.query(
      `ALTER TABLE "property" ADD COLUMN "cleaningBruttoPrice" decimal(12,2)`,
    );

    // 5. Create property_cleaner table
    await queryRunner.query(`
      CREATE TABLE "property_cleaner" (
        "propertyId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_property_cleaner" PRIMARY KEY ("propertyId", "userId"),
        CONSTRAINT "FK_property_cleaner_property" FOREIGN KEY ("propertyId")
          REFERENCES "property"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_property_cleaner_user" FOREIGN KEY ("userId")
          REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // 6. Create cleaning table
    await queryRunner.query(`
      CREATE TABLE "cleaning" (
        "id" SERIAL PRIMARY KEY,
        "date" date NOT NULL,
        "propertyId" integer NOT NULL,
        "userId" integer NOT NULL,
        "percentage" integer NOT NULL,
        CONSTRAINT "FK_cleaning_property" FOREIGN KEY ("propertyId")
          REFERENCES "property"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cleaning_user" FOREIGN KEY ("userId")
          REFERENCES "user"("id")
      )
    `);

    // 7. Index for querying cleanings by property and date
    await queryRunner.query(
      `CREATE INDEX "IDX_cleaning_property_date" ON "cleaning" ("propertyId", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cleaning_property_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cleaning"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "property_cleaner"`);
    await queryRunner.query(`ALTER TABLE "property" DROP COLUMN IF EXISTS "cleaningBruttoPrice"`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "isAdmin" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `UPDATE "user" SET "isAdmin" = true WHERE 'admin' = ANY("roles")`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "roles"`);
  }
}
