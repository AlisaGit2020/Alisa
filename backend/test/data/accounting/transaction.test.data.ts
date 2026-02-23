import { TestData } from '../test-data';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Expense } from 'src/accounting/expense/entities/expense.entity';
import { TransactionType } from '@asset-backend/common/types';

export const transactionTestData = {
  name: 'Transaction',
  tables: ['transaction'],
  baseUrl: '/accounting/transaction',
  baseUrlWithId: '/accounting/transaction/1',
  searchOptions: {
    where: {
      description: 'Some description',
    },
  } as FindManyOptions<Expense>,

  inputPost: {
    type: TransactionType.INCOME,
    sender: 'tposhrk',
    receiver: 'opkhtposk',
    description: 'kohpstrok',
    transactionDate: '2024-03-24T07:44:45.762Z',
    accountingDate: '2024-03-24T07:44:45.762Z',
    amount: '665',
    propertyId: 1,
    incomes: [
      {
        description: 'Airbnb tulo',
        amount: 665,
        quantity: 1,
        totalAmount: '665',
        incomeTypeId: 2,
        propertyId: 1,
      },
    ],
  },

  inputPut: {
    propertyId: 1,
    externalId: '126',
    sender: 'Joku toinen ihminen',
    receiver: 'Juha Koivisto',
    description: 'Vuokrasuoritus maaliskuu 2023',
    transactionDate: '2023-03-01T00:00:00.000Z',
    accountingDate: '2023-03-01T00:00:00.000Z',
    amount: 1090,
    incomes: [
      {
        incomeTypeId: 2,
        description: 'Vuokrasuoritus maaliskuu 2023',
        amount: 1090,
        quantity: 1,
        totalAmount: 1090,
      },
    ],
  },
} as TestData;
