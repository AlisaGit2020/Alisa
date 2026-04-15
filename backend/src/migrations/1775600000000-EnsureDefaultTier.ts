import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureDefaultTier1775600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if any tier is marked as default
    const defaultTier = await queryRunner.query(
      `SELECT id FROM tier WHERE "isDefault" = true LIMIT 1`,
    );

    if (defaultTier.length === 0) {
      // No default tier exists, mark Free tier as default
      await queryRunner.query(
        `UPDATE tier SET "isDefault" = true WHERE name = 'Free'`,
      );

      // If Free tier doesn't exist, mark the tier with lowest sortOrder as default
      const result = await queryRunner.query(
        `SELECT id FROM tier WHERE "isDefault" = true LIMIT 1`,
      );
      if (result.length === 0) {
        await queryRunner.query(
          `UPDATE tier SET "isDefault" = true WHERE id = (SELECT id FROM tier ORDER BY "sortOrder" ASC, id ASC LIMIT 1)`,
        );
      }
    }
  }

  public async down(): Promise<void> {
    // No rollback needed - this is a data fix
  }
}
