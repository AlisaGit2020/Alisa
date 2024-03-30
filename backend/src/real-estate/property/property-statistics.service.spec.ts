/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import {
  addIncomeAndExpenseTypes,
  addTransaction,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import {
  getTransactionDeposit1,
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
  getTransactionWithdrawal1,
} from '../../../test/data/mocks/transaction.mock';
import { StatisticKey } from '@alisa-backend/common/types';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';

describe('Property statistics service', () => {
  let app: INestApplication;

  let service: PropertyStatisticsService;
  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;
  let mainTestUser: TestUser;
  let mainPropertyId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<PropertyStatisticsService>(PropertyStatisticsService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainTestUser = testUsers.user1WithProperties;
    mainPropertyId = mainTestUser.properties[0].id;
    await addTestData();
    await sleep(100);
  });

  afterAll(async () => {
    await app.close();
  });

  const addTestData = async () => {
    const propertyId = mainPropertyId;
    const jwtUser = mainTestUser.jwtUser;

    await addIncomeAndExpenseTypes(mainTestUser.jwtUser, app);

    await addTransaction(app, jwtUser, getTransactionExpense1(propertyId));
    await addTransaction(app, jwtUser, getTransactionExpense2(propertyId));
    await addTransaction(app, jwtUser, getTransactionIncome1(propertyId));
    await addTransaction(app, jwtUser, getTransactionIncome2(propertyId));
    await addTransaction(app, jwtUser, getTransactionDeposit1(propertyId));
    await addTransaction(app, jwtUser, getTransactionWithdrawal1(propertyId));
  };

  const testAllTime = async (
    statisticsKey: StatisticKey,
    expectedValue: string,
  ) => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: 1,
      key: statisticsKey,
    });

    const statistic = statistics[0];

    expect(statistic.value).toBe(expectedValue);
  };

  const testYear = async (
    year: number,
    statisticsKey: StatisticKey,
    expectedValue: string,
  ) => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: 1,
      key: statisticsKey,
      year: year,
    });

    const statistic = statistics[0];

    expect(statistic.value).toBe(expectedValue);
  };

  const testMonth = async (
    year: number,
    month: number,
    statisticsKey: StatisticKey,
    expectedValue: string,
  ) => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: 1,
      key: statisticsKey,
      year: year,
      month: month,
    });

    const statistic = statistics[0];

    expect(statistic.value).toBe(expectedValue);
  };

  describe('Calculate statistics', () => {
    describe('When transaction is created', () => {
      it.each([
        [StatisticKey.BALANCE, '2011.36'],
        [StatisticKey.INCOME, '1339.00'],
        [StatisticKey.EXPENSE, '227.64'],
        [StatisticKey.DEPOSIT, '1000.00'],
        [StatisticKey.WITHDRAW, '100.00'],
      ])(
        `it calculates all time data correctly`,
        async (statisticsKey, expectedValue) => {
          await testAllTime(statisticsKey, expectedValue);
        },
      );

      it.each([
        [2022, StatisticKey.BALANCE, '0.00'], //No data exist
        [2023, StatisticKey.BALANCE, '2011.36'],
        [2024, StatisticKey.BALANCE, '0.00'], //No data exist
        [2023, StatisticKey.INCOME, '1339.00'],
        [2023, StatisticKey.EXPENSE, '227.64'],
        [2023, StatisticKey.DEPOSIT, '1000.00'],
        [2023, StatisticKey.WITHDRAW, '100.00'],
      ])(
        'it calculates year data correctly',
        async (year, statisticsKey, expectedValue) => {
          await testYear(year, statisticsKey, expectedValue);
        },
      );

      it.each([
        [2023, 1, StatisticKey.BALANCE, '209.36'],
        [2023, 2, StatisticKey.BALANCE, '-188.00'],
        [2023, 3, StatisticKey.BALANCE, '1990.00'],
        [2023, 4, StatisticKey.BALANCE, '0.00'], //No data exist
        [2023, 1, StatisticKey.INCOME, '0.00'],
        [2023, 2, StatisticKey.INCOME, '249.00'],
        [2023, 3, StatisticKey.INCOME, '1090.00'],
        [2023, 1, StatisticKey.EXPENSE, '0.00'],
        [2023, 2, StatisticKey.EXPENSE, '39.64'],
        [2023, 3, StatisticKey.EXPENSE, '188.00'],
        [2023, 1, StatisticKey.DEPOSIT, '0.00'],
        [2023, 2, StatisticKey.DEPOSIT, '0.00'],
        [2023, 3, StatisticKey.DEPOSIT, '1000.00'],
        [2023, 1, StatisticKey.WITHDRAW, '0.00'],
        [2023, 2, StatisticKey.WITHDRAW, '0.00'],
        [2023, 3, StatisticKey.WITHDRAW, '100.00'],
      ])(
        'it calculates month data correctly',
        async (year, month, statisticsKey, expectedValue) => {
          await testMonth(year, month, statisticsKey, expectedValue);
        },
      );
    });

    describe('When transaction is updated', () => {
      beforeAll(async () => {
        let input = getTransactionExpense1(1);
        input.amount = input.amount - 100;
        await transactionService.update(mainTestUser.jwtUser, 1, input);

        input = getTransactionIncome2(1);
        input.amount = input.amount + 100;
        await transactionService.update(mainTestUser.jwtUser, 4, input);

        input = getTransactionDeposit1(1);
        input.amount = input.amount + 100;
        await transactionService.update(mainTestUser.jwtUser, 5, input);

        input = getTransactionWithdrawal1(1);
        input.amount = input.amount - 100;
        await transactionService.update(mainTestUser.jwtUser, 6, input);

        await sleep(100);
      });

      it.each([
        [StatisticKey.BALANCE, '2011.36'],
        [StatisticKey.INCOME, '1439.00'],
        [StatisticKey.EXPENSE, '327.64'],
        [StatisticKey.DEPOSIT, '1100.00'],
        [StatisticKey.WITHDRAW, '200.00'],
      ])(
        `it calculates all time data correctly`,
        async (statisticsKey, expectedValue) => {
          await testAllTime(statisticsKey, expectedValue);
        },
      );

      it.each([
        [2023, StatisticKey.BALANCE, '2011.36'],
        [2023, StatisticKey.INCOME, '1439.00'],
        [2023, StatisticKey.EXPENSE, '327.64'],
        [2023, StatisticKey.DEPOSIT, '1100.00'],
        [2023, StatisticKey.WITHDRAW, '200.00'],
      ])(
        'it calculates year data correctly',
        async (year, statisticsKey, expectedValue) => {
          await testYear(year, statisticsKey, expectedValue);
        },
      );

      it.each([
        [2023, 1, StatisticKey.BALANCE, '109.36'],
        [2023, 2, StatisticKey.BALANCE, '-188.00'],
        [2023, 3, StatisticKey.BALANCE, '2090.00'],
        [2023, 4, StatisticKey.BALANCE, '0.00'], //No data exist
        [2023, 1, StatisticKey.INCOME, '0.00'],
        [2023, 2, StatisticKey.INCOME, '249.00'],
        [2023, 3, StatisticKey.INCOME, '1190.00'],
        [2023, 1, StatisticKey.EXPENSE, '0.00'],
        [2023, 2, StatisticKey.EXPENSE, '139.64'],
        [2023, 3, StatisticKey.EXPENSE, '188.00'],
        [2023, 1, StatisticKey.DEPOSIT, '0.00'],
        [2023, 2, StatisticKey.DEPOSIT, '0.00'],
        [2023, 3, StatisticKey.DEPOSIT, '1100.00'],
        [2023, 1, StatisticKey.WITHDRAW, '0.00'],
        [2023, 2, StatisticKey.WITHDRAW, '0.00'],
        [2023, 3, StatisticKey.WITHDRAW, '200.00'],
      ])(
        'it calculates month data correctly',
        async (year, month, statisticsKey, expectedValue) => {
          await testMonth(year, month, statisticsKey, expectedValue);
        },
      );
    });

    describe('When transaction is deleted', () => {
      beforeAll(async () => {
        for (let i = 1; i <= 6; i++) {
          await transactionService.delete(mainTestUser.jwtUser, i);
        }
        await sleep(100);
      });

      it.each([
        [StatisticKey.BALANCE, '0.00'],
        [StatisticKey.INCOME, '0.00'],
        [StatisticKey.EXPENSE, '0.00'],
        [StatisticKey.DEPOSIT, '0.00'],
        [StatisticKey.WITHDRAW, '0.00'],
      ])(
        `it calculates all time data correctly`,
        async (statisticsKey, expectedValue) => {
          await testAllTime(statisticsKey, expectedValue);
        },
      );

      it.each([
        [2023, StatisticKey.BALANCE, '0.00'],
        [2023, StatisticKey.INCOME, '0.00'],
        [2023, StatisticKey.EXPENSE, '0.00'],
        [2023, StatisticKey.DEPOSIT, '0.00'],
        [2023, StatisticKey.WITHDRAW, '0.00'],
      ])(
        'it calculates year data correctly',
        async (year, statisticsKey, expectedValue) => {
          await testYear(year, statisticsKey, expectedValue);
        },
      );

      it.each([
        [2023, 1, StatisticKey.BALANCE, '0.00'],
        [2023, 2, StatisticKey.BALANCE, '0.00'],
        [2023, 3, StatisticKey.BALANCE, '0.00'],
        [2023, 4, StatisticKey.BALANCE, '0.00'], //No data exist
        [2023, 1, StatisticKey.INCOME, '0.00'],
        [2023, 2, StatisticKey.INCOME, '0.00'],
        [2023, 3, StatisticKey.INCOME, '0.00'],
        [2023, 1, StatisticKey.EXPENSE, '0.00'],
        [2023, 2, StatisticKey.EXPENSE, '0.00'],
        [2023, 3, StatisticKey.EXPENSE, '0.00'],
        [2023, 1, StatisticKey.DEPOSIT, '0.00'],
        [2023, 2, StatisticKey.DEPOSIT, '0.00'],
        [2023, 3, StatisticKey.DEPOSIT, '0.00'],
        [2023, 1, StatisticKey.WITHDRAW, '0.00'],
        [2023, 2, StatisticKey.WITHDRAW, '0.00'],
        [2023, 3, StatisticKey.WITHDRAW, '0.00'],
      ])(
        'it calculates month data correctly',
        async (year, month, statisticsKey, expectedValue) => {
          await testMonth(year, month, statisticsKey, expectedValue);
        },
      );
    });
  });
});
