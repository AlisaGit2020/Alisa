import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { TransactionType } from '@alisa-backend/common/types';

export const getTransactionExpense1 = (
  propertyId: number,
): TransactionInputDto => {
  return {
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
): TransactionInputDto => {
  return {
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
): TransactionInputDto => {
  return {
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
): TransactionInputDto => {
  return {
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
): TransactionInputDto => {
  return {
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

export const getTransactionWithdrawal1 = (propertyId: number) => {
  return {
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

export const expenseType1: ExpenseTypeInputDto = {
  id: 1,
  name: 'Siivous',
  description: '',
  isTaxDeductible: true,
};

export const expenseType2: ExpenseTypeInputDto = {
  id: 2,
  name: 'Rahoitusvastike',
  description: '',
  isTaxDeductible: true,
};
export const expenseType3: ExpenseTypeInputDto = {
  id: 3,
  name: 'Hoito- ja ylläpitovastike',
  description: '',
  isTaxDeductible: true,
};

export const incomeType1: IncomeTypeInputDto = {
  id: 1,
  name: 'Airbnb',
  description: '',
};

export const incomeType2: IncomeTypeInputDto = {
  id: 2,
  name: 'Vuokrasuoritus',
  description: '',
};
