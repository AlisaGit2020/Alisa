import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction/transaction.service';
import { Expense } from './expense/entities/expense.entity';
import { ExpenseController } from './expense/expense.controller';
import { ExpenseService } from './expense/expense.service';
import { Transaction } from './transaction/entities/transaction.entity';
import { ExpenseTypeController } from './expense/expense-type.controller';
import { ExpenseTypeService } from './expense/expense-type.service';
import { ExpenseType } from './expense/entities/expense-type.entity';
import { TransactionController } from './transaction/transaction.controller';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { IncomeTypeController } from './income/income-type.controller';
import { IncomeController } from './income/income.controller';
import { IncomeService } from './income/income.service';
import { IncomeTypeService } from './income/income-type.service';
import { IncomeType } from './income/entities/income-type.entity';
import { Income } from './income/entities/income.entity';
import { AuthModule } from '@alisa-backend/auth/auth.module';

@Module({
  controllers: [
    ExpenseTypeController,
    ExpenseController,
    IncomeTypeController,
    IncomeController,
    TransactionController,
  ],
  providers: [
    ExpenseService,
    ExpenseTypeService,
    IncomeService,
    IncomeTypeService,
    TransactionService,
  ],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Transaction,
      Expense,
      ExpenseType,
      Income,
      IncomeType,
      Property,
    ]),
  ],
  exports: [ExpenseService, IncomeService],
})
export class AccountingModule {}
