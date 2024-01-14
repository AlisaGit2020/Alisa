import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { TestData } from '../test-data';
import { ExpenseTypeInputDto } from 'src/accounting/expense/dtos/expense-type-input.dto';
import { ExpenseType } from 'src/accounting/expense/entities/expense-type.entity';

export const expenseTypeTestData = {
  name: 'Expense type',
  tables: ['expense_type'],
  baseUrl: '/accounting/expense/type',
  baseUrlWithId: '/accounting/expense/type/1',

  inputPost: {
    name: 'Lainan korko',
    description: 'Pankkilaina lyhennyksen koron osuus',
    isTaxDeductible: true,
  } as ExpenseTypeInputDto,

  inputPut: {
    id: 1,
    name: 'Lainan lyhennys',
    description: 'Pankkilaina lyhennyksen lainan lyhennys',
    isTaxDeductible: false,
  } as ExpenseTypeInputDto,

  expected: {
    id: 1,
    name: 'Lainan korko',
    description: 'Pankkilaina lyhennyksen koron osuus',
    isTaxDeductible: true,
  },

  expectedPut: {
    id: 1,
    name: 'Lainan lyhennys',
    description: 'Pankkilaina lyhennyksen lainan lyhennys',
    isTaxDeductible: false,
  },

  searchOptions: {
    where: {
      name: 'Lainan korko',
    },
  } as FindManyOptions<ExpenseType>,
} as TestData;
