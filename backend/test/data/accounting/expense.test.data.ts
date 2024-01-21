import { TestData } from '../test-data';
import { ExpenseInputDto } from 'src/accounting/expense/dtos/expense-input.dto';
import { TransactionInputDto } from 'src/accounting/transaction/dtos/transaction-input.dto';
import { expenseTypeTestData } from './expense-type.test.data';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Expense } from 'src/accounting/expense/entities/expense.entity';
import { propertyTestData } from '../real-estate/property.test.data';
import { parseISO, startOfDay } from 'date-fns';

export const expenseTestData = {
  name: 'Expense',
  tables: ['expense', 'expense_type', 'property', 'transaction'],
  baseUrl: '/accounting/expense',
  baseUrlWithId: '/accounting/expense/1',

  inputPost: {
    expenseType: expenseTypeTestData.inputPost,
    property: propertyTestData.inputPost,
    transaction: {
      description: 'Siivousmaksu',
      transactionDate: startOfDay(new Date('2023-01-31')),
      accountingDate: startOfDay(new Date('2023-02-28')),
      amount: 9.91,
      quantity: 4,
      totalAmount: 39.64,
    } as TransactionInputDto,
  } as ExpenseInputDto,

  inputPut: {
    expenseType: expenseTypeTestData.inputPut,
    property: propertyTestData.inputPut,
    transaction: {
      id: 1,
      description: 'Yhtiövastike',
      transactionDate: startOfDay(new Date('2023-02-28')),
      accountingDate: startOfDay(new Date('2023-03-31')),
      amount: 188,
      quantity: 1,
      totalAmount: 188,
    } as TransactionInputDto,
  } as ExpenseInputDto,

  expected: {
    expenseType: expenseTypeTestData.expected,
    expenseTypeId: 1,
    property: propertyTestData.expected,
    propertyId: 1,
    transaction: {
      description: 'Siivousmaksu',
      transactionDate: startOfDay(new Date('2023-01-31')).toISOString(),
      accountingDate: startOfDay(new Date('2023-02-28')).toISOString(),
      amount: 9.91,
      quantity: 4,
      totalAmount: -39.64,
      id: 1,
    },
    id: 1,
  },

  expectedPut: {
    id: 1,
    expenseType: expenseTypeTestData.expectedPut,
    expenseTypeId: 1,
    property: propertyTestData.expectedPut,
    propertyId: 1,
    transaction: {
      id: 1,
      description: 'Yhtiövastike',
      transactionDate: startOfDay(new Date('2023-02-28')).toISOString(),
      accountingDate: startOfDay(new Date('2023-03-31')).toISOString(),
      amount: 188.0,
      quantity: 1.0,
      totalAmount: -188.0,
    },
  },

  searchOptions: {
    where: {
      transaction: { id: 1 },
    },
  } as FindManyOptions<Expense>,
} as TestData;
