/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import {
  addIncomeAndExpenseTypes,
  addTransaction,
  emptyTables,
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
import { StatisticKey, TransactionStatus } from '@alisa-backend/common/types';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { DataSource } from 'typeorm';

describe('Property statistics service', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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

    dataSource = app.get(DataSource);
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
    await addIncomeAndExpenseTypes(mainTestUser.jwtUser, app);
  };

  const addTransactions = async (status: TransactionStatus) => {
    const jwtUser = mainTestUser.jwtUser;
    const propertyId = mainPropertyId;
    await addTransaction(
      app,
      jwtUser,
      getTransactionExpense1(propertyId, status),
    );
    await addTransaction(
      app,
      jwtUser,
      getTransactionExpense2(propertyId, status),
    );
    await addTransaction(
      app,
      jwtUser,
      getTransactionIncome1(propertyId, status),
    );
    await addTransaction(
      app,
      jwtUser,
      getTransactionIncome2(propertyId, status),
    );
    await addTransaction(
      app,
      jwtUser,
      getTransactionDeposit1(propertyId, status),
    );
    await addTransaction(
      app,
      jwtUser,
      getTransactionWithdrawal1(propertyId, status),
    );
  };

  const testAllTime = async (
    statisticsKey: StatisticKey,
    expectedValue: string,
  ) => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: mainPropertyId,
      key: statisticsKey,
    });

    const statistic = statistics[0];

    expect(statistic.value).toBe(expectedValue);
  };

  const checkNoDataExist = async () => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: mainPropertyId,
    });
    expect(statistics.length).toBe(0);
  };

  const checkSomeDataExist = async () => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: mainPropertyId,
    });
    expect(statistics.length).toBeGreaterThan(0);
  };

  const checkAllResetToZero = async () => {
    const statistics = await service.search(mainTestUser.jwtUser, {
      propertyId: mainPropertyId,
    });
    for (const statistic of statistics) {
      expect(statistic.value).toBe('0.00');
    }
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

  const testAcceptedTransaction = async () => {
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
  };

  describe('Calculate statistics', () => {
    describe('When accepted transaction is created', () => {
      beforeAll(async () => {
        await emptyTables(dataSource, ['transaction', 'property_statistics']);
        await addTransactions(TransactionStatus.ACCEPTED);
        await sleep(100);
      });

      testAcceptedTransaction();

      it('it reset all statistics to zero after all transactions are deleted', async () => {
        for (let i = 1; i <= 6; i++) {
          await transactionService.delete(mainTestUser.jwtUser, i);
        }
        await sleep(100);
        await checkAllResetToZero();
      });
    });

    describe('When pending transaction is created', () => {
      beforeAll(async () => {
        await emptyTables(dataSource, ['transaction', 'property_statistics']);
        await addTransactions(TransactionStatus.PENDING);
        await sleep(100);
      });

      it('it does not calculate any statistics', async () => {
        await checkNoDataExist();
      });

      it('it does not calculate any statistics after transaction is updated', async () => {
        const input = getTransactionExpense1(1, TransactionStatus.PENDING);
        input.amount = input.amount - 100;
        await transactionService.update(mainTestUser.jwtUser, 1, input);
        await sleep(100);
        await checkNoDataExist();
      });

      it('it calculates statistics after transaction is accepted', async () => {
        await transactionService.update(mainTestUser.jwtUser, 1, {
          ...getTransactionExpense1(1, TransactionStatus.ACCEPTED),
          amount: 100,
        });
        await sleep(100);
        await checkSomeDataExist();
      });
    });
  });
});
