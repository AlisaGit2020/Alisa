import { TestData } from '../test-data';
import { IncomeInputDto } from 'src/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from 'src/accounting/transaction/dtos/transaction-input.dto';
import { incomeTypeTestData } from './income-type.test.data';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Income } from 'src/accounting/income/entities/income.entity';
import { propertyTestData } from '../real-estate/property.test.data';
import { startOfDay } from 'date-fns';

export const incomeTestData = {
  name: 'Income',
  tables: ['income', 'income_type', 'property', 'transaction'],
  baseUrl: '/accounting/income',
  baseUrlWithId: '/accounting/income/1',

  inputPost: {
    incomeType: incomeTypeTestData.inputPost,
    property: propertyTestData.inputPost,
    description: 'Siivous',
    amount: 39.64,
    quantity: 1,
    totalAmount: 39.64,
    transaction: {
      externalId: '123',
      sender: 'Aurora',
      receiver: 'Bolag asuntoyhtiö Oy',
      description: 'Siivousmaksu',
      transactionDate: startOfDay(new Date('2023-01-31')),
      accountingDate: startOfDay(new Date('2023-02-28')),
      amount: 39.64,
    } as TransactionInputDto,
  } as IncomeInputDto,

  inputPut: {
    incomeType: incomeTypeTestData.inputPut,
    property: propertyTestData.inputPut,
    description: 'Yhtiövastike',
    amount: 94,
    quantity: 2,
    totalAmount: 188,
    transaction: {
      id: 1,
      externalId: '124',
      sender: 'Yrjöntie',
      receiver: 'Espoon kaupunki',
      description: 'Yhtiövastike',
      transactionDate: startOfDay(new Date('2023-02-28')),
      accountingDate: startOfDay(new Date('2023-03-31')),
      amount: 188,
    } as TransactionInputDto,
  } as IncomeInputDto,

  expected: {
    incomeType: incomeTypeTestData.expected,
    incomeTypeId: 1,
    property: propertyTestData.expected,
    propertyId: 1,
    description: 'Siivous',
    amount: 39.64,
    quantity: 1,
    totalAmount: 39.64,
    transaction: {
      externalId: '123',
      sender: 'Aurora',
      receiver: 'Bolag asuntoyhtiö Oy',
      description: 'Siivousmaksu',
      transactionDate: startOfDay(new Date('2023-01-31')).toISOString(),
      accountingDate: startOfDay(new Date('2023-02-28')).toISOString(),
      amount: 39.64,
      id: 1,
    },
    transactionId: 1,
    id: 1,
  },

  expectedPut: {
    id: 1,
    incomeType: incomeTypeTestData.expectedPut,
    incomeTypeId: 1,
    property: propertyTestData.expectedPut,
    propertyId: 1,
    description: 'Yhtiövastike',
    amount: 94,
    quantity: 2,
    totalAmount: 188,
    transaction: {
      externalId: '124',
      id: 1,
      sender: 'Yrjöntie',
      receiver: 'Espoon kaupunki',
      description: 'Yhtiövastike',
      transactionDate: startOfDay(new Date('2023-02-28')).toISOString(),
      accountingDate: startOfDay(new Date('2023-03-31')).toISOString(),
      amount: 188.0,
    },
    transactionId: 1,
  },

  searchOptions: {
    where: {
      transaction: { id: 1 },
    },
  } as FindManyOptions<Income>,
} as TestData;
