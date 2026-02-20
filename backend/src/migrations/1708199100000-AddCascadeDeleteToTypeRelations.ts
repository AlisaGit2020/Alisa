import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeDeleteToTypeRelations1708199100000
  implements MigrationInterface
{
  private async dropAndRecreateForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    referencedTable: string,
    referencedColumn: string,
    onDelete: 'CASCADE' | 'NO ACTION' = 'CASCADE',
  ): Promise<void> {
    // Find existing FK constraint name
    const constraints = await queryRunner.query(
      `
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = $2
    `,
      [tableName, columnName],
    );

    // Drop existing constraint if found
    for (const row of constraints) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" DROP CONSTRAINT "${row.constraint_name}"`,
      );
    }

    // Create new constraint with CASCADE
    const newConstraintName = `FK_${tableName}_${columnName}_cascade`;
    await queryRunner.query(
      `ALTER TABLE "${tableName}"
       ADD CONSTRAINT "${newConstraintName}"
       FOREIGN KEY ("${columnName}") REFERENCES "${referencedTable}"("${referencedColumn}")
       ON DELETE ${onDelete}`,
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add ON DELETE CASCADE to expense/income type foreign keys
    await this.dropAndRecreateForeignKey(
      queryRunner,
      'expense',
      'expenseTypeId',
      'expense_type',
      'id',
      'CASCADE',
    );
    await this.dropAndRecreateForeignKey(
      queryRunner,
      'income',
      'incomeTypeId',
      'income_type',
      'id',
      'CASCADE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to NO ACTION (default)
    await this.dropAndRecreateForeignKey(
      queryRunner,
      'expense',
      'expenseTypeId',
      'expense_type',
      'id',
      'NO ACTION',
    );
    await this.dropAndRecreateForeignKey(
      queryRunner,
      'income',
      'incomeTypeId',
      'income_type',
      'id',
      'NO ACTION',
    );
  }
}
