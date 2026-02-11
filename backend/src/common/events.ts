import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';

export const Events = {
  Balance: {
    Changed: 'balance.changed',
  },
  Transaction: {
    Created: 'transaction.created',
    Updated: 'transaction.updated',
    Accepted: 'transaction.accepted',
    Deleted: 'transaction.deleted',
  },
  Expense: {
    AccountingDateChanged: 'expense.accountingDateChanged',
  },
  Income: {
    AccountingDateChanged: 'income.accountingDateChanged',
  },
};

export class BalanceChangedEvent {
  public propertyId: number;
  public newBalance: number;
  constructor(propertyId: number, newBalance: number) {
    this.propertyId = propertyId;
    this.newBalance = newBalance;
  }
}

export class TransactionCreatedEvent {
  public transaction: Transaction;
  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }
}

export class TransactionAcceptedEvent {
  public transaction: Transaction;
  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }
}

export class TransactionUpdatedEvent {
  public oldTransaction: Transaction;
  public updatedTransaction: Transaction;
  constructor(oldTransaction: Transaction, updatedTransaction: Transaction) {
    this.oldTransaction = oldTransaction;
    this.updatedTransaction = updatedTransaction;
  }
}

export class TransactionDeletedEvent {
  public transaction: Transaction;
  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }
}

export class ExpenseAccountingDateChangedEvent {
  public expense: Expense;
  public oldAccountingDate: Date;
  constructor(expense: Expense, oldAccountingDate: Date) {
    this.expense = expense;
    this.oldAccountingDate = oldAccountingDate;
  }
}

export class IncomeAccountingDateChangedEvent {
  public income: Income;
  public oldAccountingDate: Date;
  constructor(income: Income, oldAccountingDate: Date) {
    this.income = income;
    this.oldAccountingDate = oldAccountingDate;
  }
}
