import { TestData } from '../test-data';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { Expense } from 'src/accounting/expense/entities/expense.entity';

export const transactionTestData = {
  name: 'Transaction',
  tables: ['transaction'],
  baseUrl: '/accounting/transaction',
  searchOptions: {
    where: {
      description: 'Some description',
    },
  } as FindManyOptions<Expense>,
} as TestData;
