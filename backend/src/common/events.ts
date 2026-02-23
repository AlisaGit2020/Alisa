import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { Income } from '@asset-backend/accounting/income/entities/income.entity';

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
    StandaloneCreated: 'expense.standaloneCreated',
    StandaloneUpdated: 'expense.standaloneUpdated',
    StandaloneDeleted: 'expense.standaloneDeleted',
  },
  Income: {
    AccountingDateChanged: 'income.accountingDateChanged',
    StandaloneCreated: 'income.standaloneCreated',
    StandaloneUpdated: 'income.standaloneUpdated',
    StandaloneDeleted: 'income.standaloneDeleted',
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

export class StandaloneIncomeCreatedEvent {
  public income: Income;
  constructor(income: Income) {
    this.income = income;
  }
}

export class StandaloneIncomeUpdatedEvent {
  public income: Income;
  public oldTotalAmount: number;
  public oldAccountingDate: Date;
  public oldIncomeTypeId: number;
  public oldIncomeTypeKey: string;
  constructor(
    income: Income,
    oldTotalAmount: number,
    oldAccountingDate: Date,
    oldIncomeTypeId: number,
    oldIncomeTypeKey: string,
  ) {
    this.income = income;
    this.oldTotalAmount = oldTotalAmount;
    this.oldAccountingDate = oldAccountingDate;
    this.oldIncomeTypeId = oldIncomeTypeId;
    this.oldIncomeTypeKey = oldIncomeTypeKey;
  }
}

export class StandaloneIncomeDeletedEvent {
  public income: Income;
  constructor(income: Income) {
    this.income = income;
  }
}

export class StandaloneExpenseCreatedEvent {
  public expense: Expense;
  constructor(expense: Expense) {
    this.expense = expense;
  }
}

export class StandaloneExpenseUpdatedEvent {
  public expense: Expense;
  public oldTotalAmount: number;
  public oldAccountingDate: Date;
  constructor(
    expense: Expense,
    oldTotalAmount: number,
    oldAccountingDate: Date,
  ) {
    this.expense = expense;
    this.oldTotalAmount = oldTotalAmount;
    this.oldAccountingDate = oldAccountingDate;
  }
}

export class StandaloneExpenseDeletedEvent {
  public expense: Expense;
  constructor(expense: Expense) {
    this.expense = expense;
  }
}
