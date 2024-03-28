import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';

export const Events = {
  Balance: {
    Changed: 'balance.changed',
  },
  Transaction: {
    Created: 'transaction.created',
    Updated: 'transaction.updated',
    Deleted: 'transaction.deleted',
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

export class TransactionUpdatedEvent {
  public oldTransaction: Transaction;
  public newTransaction: Transaction;
  constructor(oldTransaction: Transaction, newtransaction: Transaction) {
    this.oldTransaction = oldTransaction;
    this.newTransaction = newtransaction;
  }
}

export class TransactionDeletedEvent {
  public transaction: Transaction;
  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }
}
