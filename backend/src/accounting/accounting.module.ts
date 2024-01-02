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

@Module({
  controllers: [ExpenseTypeController, ExpenseController],
  providers: [TransactionService, ExpenseService, ExpenseTypeService],
  imports: [TypeOrmModule.forFeature([Transaction, Expense, ExpenseType])]
})
export class AccountingModule { }
