import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseTypeDefault } from './entities/expense-type-default.entity';
import { IncomeTypeDefault } from './entities/income-type-default.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { DefaultsSeeder } from './defaults.seeder';
import { UserDefaultsService } from './user-defaults.service';
import { PeopleModule } from '@alisa-backend/people/people.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseTypeDefault,
      IncomeTypeDefault,
      ExpenseType,
      IncomeType,
    ]),
    PeopleModule,
  ],
  providers: [DefaultsSeeder, UserDefaultsService],
  exports: [UserDefaultsService],
})
export class DefaultsModule {}
