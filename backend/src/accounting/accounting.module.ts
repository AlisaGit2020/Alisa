import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction/transaction.service';
import { Expense } from './expense/entities/expense.entity';
import { ExpenseController } from './expense/expense.controller';
import { ExpenseService } from './expense/expense.service';
import { Transaction } from './transaction/entities/transaction.entity';

@Module({
  controllers: [ExpenseController],
  providers: [TransactionService, ExpenseService],
  imports: [TypeOrmModule.forFeature([Transaction, Expense])]
})
export class AccountingModule { }
