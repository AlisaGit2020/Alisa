/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { AppModule } from 'src/app.module';
import { TransactionService } from './transaction.service';

import {
  addIncomeAndExpenseTypes,
  addTransaction,
  emptyTables,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import {
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
} from '../../../test/data/mocks/transaction.mock';
import { DataSource } from 'typeorm';
import { BalanceService } from '@alisa-backend/accounting/transaction/balance.service';

describe('Balance service', () => {
  let app: INestApplication;
  let service: BalanceService;
  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<BalanceService>(BalanceService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authorization', () => {
    it('throws not found when property does not exist', async () => {
      await expect(service.getBalance(mainUser.jwtUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when not owner', async () => {
      await expect(
        service.getBalance(testUsers.userWithoutProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Calculation', () => {
    beforeEach(async () => {
      await emptyTables(app.get(DataSource), ['transaction']);
    });

    const addTransactions = async () => {
      await addTransaction(app, mainUser.jwtUser, getTransactionIncome1(1));
      await addTransaction(app, mainUser.jwtUser, getTransactionIncome2(1));
      await addTransaction(app, mainUser.jwtUser, getTransactionExpense1(1));
      await addTransaction(app, mainUser.jwtUser, getTransactionExpense2(1));
    };

    it('gets zero balance when no transactions', async () => {
      const balance = await service.getBalance(mainUser.jwtUser, 1);
      expect(balance).toBe(0);
    });

    it('gets balance correctly when add transactions to empty table', async () => {
      await addTransactions();

      const balance = await service.getBalance(mainUser.jwtUser, 1);
      expect(balance).toBe(1111.36);
    });

    it.each([
      [4, -288],
      [1, 149],
      [2, 990],
    ])(
      'gets balance correctly when edit a transaction',
      async (transactionId: number, newAmount: number) => {
        await addTransactions();
        await transactionService.update(mainUser.jwtUser, transactionId, {
          accountingDate: undefined,
          description: '',
          receiver: '',
          sender: '',
          transactionDate: undefined,
          amount: newAmount, //100 less than original.
        });
        const balance = await service.getBalance(mainUser.jwtUser, 1);
        expect(balance).toBe(1011.36);
      },
    );

    it.each([
      [1, 862.36],
      [2, 21.36],
      [3, 1151],
      [4, 1299.36],
    ])(
      'gets balance correctly when delete a transaction',
      async (transactionId: number, expectedBalance) => {
        await addTransactions();
        await transactionService.delete(mainUser.jwtUser, transactionId);
        const balance = await service.getBalance(mainUser.jwtUser, 1);
        expect(balance).toBe(expectedBalance);
      },
    );
  });
});
