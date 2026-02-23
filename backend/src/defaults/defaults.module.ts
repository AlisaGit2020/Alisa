import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseType } from '@asset-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@asset-backend/accounting/income/entities/income-type.entity';
import { DefaultsSeeder } from './defaults.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseType, IncomeType])],
  providers: [DefaultsSeeder],
  exports: [],
})
export class DefaultsModule {}
