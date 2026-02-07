import { TestData } from '../test-data';
import { IncomeInputDto } from 'src/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from 'src/accounting/transaction/dtos/transaction-input.dto';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Income } from 'src/accounting/income/entities/income.entity';
import { startOfDay } from 'date-fns';
import { TransactionStatus } from '@alisa-backend/common/types';

export const incomeTestData = {
  name: 'Income',
  tables: ['income', 'income_type', 'property', 'transaction'],
  baseUrl: '/accounting/income',
  baseUrlWithId: '/accounting/income/1',

  inputPost: {
    incomeTypeId: 1,
    propertyId: 1,
    description: 'Siivous',
    amount: 39.64,
    quantity: 1,
    totalAmount: 39.64,
    transaction: {
      status: TransactionStatus.ACCEPTED,
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
    description: 'Yhtiövastike',
    amount: 94,
    quantity: 2,
    totalAmount: 188,
    transaction: {
      id: 1,
      status: TransactionStatus.ACCEPTED,
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
    incomeTypeId: 1,
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
    incomeTypeId: 1,
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
      propertyId: 1,
    },
    transactionId: 1,
  },

  searchOptions: {
    where: {
      transaction: { id: 1 },
    },
  } as FindManyOptions<Income>,
} as TestData;
