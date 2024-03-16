import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { TestData } from '../test-data';
import { IncomeTypeInputDto } from 'src/accounting/income/dtos/income-type-input.dto';
import { IncomeType } from 'src/accounting/income/entities/income-type.entity';

export const incomeTypeTestData = {
  name: 'Income type',
  tables: ['income_type'],
  baseUrl: '/accounting/income/type',
  baseUrlWithId: '/accounting/income/type/1',

  inputPost: {
    name: 'Lainan korko',
    description: 'Pankkilaina lyhennyksen koron osuus',
  } as IncomeTypeInputDto,

  inputPut: {
    id: 1,
    name: 'Lainan lyhennys',
    description: 'Pankkilaina lyhennyksen lainan lyhennys',
  } as IncomeTypeInputDto,

  expected: {
    id: 1,
    name: 'Lainan korko',
    description: 'Pankkilaina lyhennyksen koron osuus',
  },

  expectedPut: {
    id: 1,
    name: 'Lainan lyhennys',
    description: 'Pankkilaina lyhennyksen lainan lyhennys',
    userId: 2,
  },

  searchOptions: {
    where: {
      name: 'Lainan korko',
    },
  } as FindManyOptions<IncomeType>,
} as TestData;
