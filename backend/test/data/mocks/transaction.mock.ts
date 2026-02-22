import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

export const getTransactionExpense1 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
): TransactionInputDto => {
  return {
    status: status,
    type: TransactionType.EXPENSE,
    propertyId: propertyId,
    externalId: '123',
    sender: 'Aurora',
    receiver: 'Bolag asuntoyhtiö Oy',
    description: 'Siivousmaksu',
    transactionDate: new Date('2023-01-31'),
    accountingDate: new Date('2023-02-28'),
    amount: -39.64,
    expenses: [
      {
        expenseTypeId: 1,
        description: 'Siivous',
        amount: 39.64,
        quantity: 1,
        totalAmount: 39.64,
      } as ExpenseInputDto,
    ],
  };
};

export const getTransactionExpense2 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
): TransactionInputDto => {
  return {
    status: status,
    type: TransactionType.EXPENSE,
    propertyId: propertyId,
    externalId: '124',
    sender: 'Yrjöntie',
    receiver: 'Espoon kaupunki',
    description: 'Yhtiövastike',
    transactionDate: new Date('2023-02-28'),
    accountingDate: new Date('2023-03-31'),
    amount: -188,
    expenses: [
      {
        expenseTypeId: 1,
        description: 'Rahoitusvastike',
        amount: 90,
        quantity: 1,
        totalAmount: 90,
      } as ExpenseInputDto,
      {
        expenseTypeId: 2,
        description: 'Hoito- ja ylläpitovastike',
        amount: 98,
        quantity: 1,
        totalAmount: 98,
      } as ExpenseInputDto,
    ],
  };
};

export const getTransactionIncome1 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
): TransactionInputDto => {
  return {
    status: status,
    type: TransactionType.INCOME,
    propertyId: propertyId,
    externalId: '125',
    sender: 'Airbnb',
    receiver: 'Juha Koivisto',
    description: 'Airbnb',
    transactionDate: new Date('2023-01-31'),
    accountingDate: new Date('2023-02-28'),
    amount: 249,
    incomes: [
      {
        incomeTypeId: 1,
        description: 'Airbnb #KAT45CO',
        amount: 100,
        quantity: 1,
        totalAmount: 100,
      } as IncomeInputDto,
      {
        incomeTypeId: 1,
        description: 'Airbnb #GTY23YTE',
        amount: 149,
        quantity: 1,
        totalAmount: 149,
      } as IncomeInputDto,
    ],
  };
};

export const getTransactionIncome2 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
): TransactionInputDto => {
  return {
    status: status,
    type: TransactionType.INCOME,
    propertyId: propertyId,
    externalId: '126',
    sender: 'Joku Ihminen',
    receiver: 'Juha Koivisto',
    description: 'Vuokrasuoritus maaliskuu 2023',
    transactionDate: new Date('2023-03-01'),
    accountingDate: new Date('2023-03-01'),
    amount: 1090,
    incomes: [
      {
        incomeTypeId: 2,
        description: 'Vuokrasuoritus maaliskuu 2023',
        amount: 1090,
        quantity: 1,
        totalAmount: 1090,
      } as IncomeInputDto,
    ],
  };
};

export const getTransactionDeposit1 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
): TransactionInputDto => {
  return {
    status: status,
    type: TransactionType.DEPOSIT,
    propertyId: propertyId,
    externalId: '127',
    sender: 'Juha Koivisto',
    receiver: 'Juha Koivisto',
    description: 'Talletus',
    transactionDate: new Date('2023-03-01'),
    accountingDate: new Date('2023-03-01'),
    amount: 1000,
  };
};

export const getTransactionWithdrawal1 = (
  propertyId: number,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
) => {
  return {
    status: status,
    type: TransactionType.WITHDRAW,
    propertyId: propertyId,
    externalId: '128',
    sender: 'Juha Koivisto',
    receiver: 'Juha Koivisto',
    description: 'Nosto',
    transactionDate: new Date('2023-03-01'),
    accountingDate: new Date('2023-03-01'),
    amount: -100,
  };
};

// Expense and income types are now global and seeded by DefaultsSeeder.
// The transactions above reference global type IDs (1, 2) which are assigned
// based on the order in which DefaultsSeeder inserts them.
