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
  sleep,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import {
  getTransactionDeposit1,
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
  getTransactionWithdrawal1,
} from '../../../test/data/mocks/transaction.mock';
import { DataSource } from 'typeorm';
import { BalanceService } from '@alisa-backend/accounting/transaction/balance.service';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { TransactionStatus } from '@alisa-backend/common/types';

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

  const saveTransactions = async (transactions: TransactionInputDto[]) => {
    for (const transaction of transactions) {
      await addTransaction(app, mainUser.jwtUser, transaction);
    }
    await sleep(50);
  };

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
      const propertyId = 1;
      const transactions = [
        getTransactionIncome1(propertyId, TransactionStatus.ACCEPTED),
        getTransactionIncome2(propertyId, TransactionStatus.ACCEPTED),
        getTransactionExpense1(propertyId, TransactionStatus.ACCEPTED),
        getTransactionExpense2(propertyId, TransactionStatus.PENDING),
        getTransactionExpense2(propertyId, TransactionStatus.ACCEPTED),
        getTransactionDeposit1(propertyId, TransactionStatus.ACCEPTED),
        getTransactionWithdrawal1(propertyId, TransactionStatus.ACCEPTED),
        getTransactionExpense1(propertyId, TransactionStatus.PENDING),
      ];
      await saveTransactions(transactions);
    };

    it('gets zero balance when no transactions', async () => {
      const balance = await service.getBalance(mainUser.jwtUser, 1);
      expect(balance).toBe(0);
    });

    it('gets balance correctly when add transactions to empty table', async () => {
      await addTransactions();
      await sleep(50);
      const balance = await service.getBalance(mainUser.jwtUser, 1);
      expect(balance).toBe(2011.36);
    });

    it('does not save balance for pending transaction', async () => {
      const savedTransaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(1, TransactionStatus.PENDING),
      );
      await sleep(20);
      const transaction = await transactionService.findOne(
        mainUser.jwtUser,
        savedTransaction.id,
      );
      expect(transaction.balance).toBe(0);
    });

    it(`it does not change pending transaction balance when update`, async () => {
      await addTransactions();

      await transactionService.update(mainUser.jwtUser, 7, {
        accountingDate: undefined,
        description: '',
        receiver: '',
        sender: '',
        transactionDate: undefined,
        amount: 156, //100 less than original.
      });
      await sleep(20);
      const transaction = await transactionService.findOne(mainUser.jwtUser, 8);
      expect(transaction.balance).toBe(0);
    });

    it('changes balance when accept a transaction', async () => {
      const savedTransaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionIncome1(1, TransactionStatus.PENDING),
      );

      await transactionService.update(
        mainUser.jwtUser,
        savedTransaction.id,
        getTransactionIncome1(1, TransactionStatus.ACCEPTED),
      );
      await sleep(20);
      const transaction = await transactionService.findOne(
        mainUser.jwtUser,
        savedTransaction.id,
      );
      expect(transaction.balance).toBe(249);
    });

    it.each([
      [1, 1762.36],
      [2, 921.36],
      [3, 2051],
      [4, 2199.36],
    ])(
      'gets balance correctly when delete a transaction',
      async (transactionId: number, expectedBalance) => {
        await addTransactions();
        await sleep(100);
        await transactionService.delete(mainUser.jwtUser, transactionId);
        await sleep(50);
        const balance = await service.getBalance(mainUser.jwtUser, 1);
        expect(balance).toBe(expectedBalance);
      },
    );
  });
});
