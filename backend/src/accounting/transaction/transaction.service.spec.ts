/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { AppModule } from 'src/app.module';
import { TransactionService } from './transaction.service';
import { ExpenseService } from '../expense/expense.service';

import {
  addTransaction,
  addTransactionsToTestUsers,
  emptyTablesV2,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  getTransactionExpense1,
  getTransactionIncome1,
  getTransactionIncome2,
} from '../../../test/data/mocks/transaction.mock';
import { FindOptionsWhere, In } from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';

describe('Transaction service', () => {
  let app: INestApplication;
  let service: TransactionService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let expenseService: ExpenseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<TransactionService>(TransactionService);
    expenseService = app.get<ExpenseService>(ExpenseService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    await addTransactionsToTestUsers(app, testUsers);
    await sleep(500);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    expenseService = app.get<ExpenseService>(ExpenseService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    await addTransactionsToTestUsers(app, testUsers);
    await sleep(50);
  });

  describe('Create', () => {
    it('does not allow add a transaction for another user property', async () => {
      const input = getTransactionIncome1(1);
      await expect(
        service.add(testUsers.userWithoutProperties.jwtUser, input),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('saves transaction amount as negative when it is an expense', async () => {
      const input = getTransactionExpense1(1);
      input.amount = 100;
      const transaction = await service.add(mainUser.jwtUser, input);
      expect(transaction.amount).toBe(-100);

      //Clean up
      await service.delete(mainUser.jwtUser, transaction.id);
    });

    it.each([
      [TransactionType.EXPENSE, getTransactionIncome1(1)],
      [TransactionType.INCOME, getTransactionExpense1(1)],
      [TransactionType.DEPOSIT, getTransactionIncome1(1)],
      [TransactionType.DEPOSIT, getTransactionExpense1(1)],
      [TransactionType.WITHDRAW, getTransactionIncome1(1)],
      [TransactionType.WITHDRAW, getTransactionExpense1(1)],
    ])(
      'throws when adding invalid data to %s transaction type',
      async (type, input) => {
        input.type = type;
        await expect(service.add(mainUser.jwtUser, input)).rejects.toThrow(
          BadRequestException,
        );
      },
    );

    it('throws when accepted transaction type is unknown', async () => {
      const input = getTransactionIncome1(1);
      input.type = TransactionType.UNKNOWN;
      await expect(service.add(mainUser.jwtUser, input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Read', () => {
    it('returns own transaction', async () => {
      const transactions = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        1,
      );
      expect(transactions).not.toBeNull();
    });

    it('returns null when transaction does not exist', async () => {
      const transactions = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        999,
      );
      expect(transactions).toBeNull();
    });

    it('throws UnauthorizedException when trying to read other user transaction', async () => {
      await expect(
        service.findOne(testUsers.userWithoutProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update', () => {
    it('updates when own transaction and throws when not', async () => {
      const transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        getTransactionIncome1(1, TransactionStatus.PENDING),
      );

      const input = {
        type: TransactionType.INCOME,
        receiver: 'Escobar',
        sender: 'Batman',
        accountingDate: new Date('2023-03-29'),
        transactionDate: new Date('2023-03-29'),
        amount: 1000,
        description: 'New description',
      };

      const editedTransaction = await service.update(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
        input,
      );

      expect(editedTransaction).toMatchObject(input);

      //Reject when not an owner.
      await expect(
        service.update(
          testUsers.userWithoutProperties.jwtUser,
          transaction.id,
          input,
        ),
      ).rejects.toThrow(UnauthorizedException);

      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
    });

    it('saves transaction amount as negative when it is an expense', async () => {
      const input = getTransactionExpense1(1, TransactionStatus.PENDING);
      input.amount = 100;
      const transaction = await service.add(mainUser.jwtUser, input);

      //Update transaction
      transaction.amount = 1000;
      const editedTransaction = await service.update(
        mainUser.jwtUser,
        transaction.id,
        transaction,
      );

      expect(editedTransaction.amount).toBe(-1000);

      //Clean up
      await service.delete(mainUser.jwtUser, transaction.id);
    });

    it('deletes expense row when the row is not in the input', async () => {
      const transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        {
          type: TransactionType.EXPENSE,
          sender: 'Batman',
          receiver: 'Escobar',
          accountingDate: new Date('2023-03-29'),
          transactionDate: new Date('2023-03-29'),
          amount: 1000,
          description: 'Transaction',
          propertyId: 1,
          expenses: [
            {
              description: 'Expense1',
              amount: 100,
              quantity: 1,
              expenseTypeId: 1,
              totalAmount: 100,
            },
            {
              description: 'Expense2',
              amount: 100,
              quantity: 1,
              expenseTypeId: 1,
              totalAmount: 100,
            },
          ],
        },
      );
      //Remove last expense
      transaction.expenses = transaction.expenses.slice(0, 1);
      const editedTransaction = await service.update(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
        transaction,
      );

      expect(editedTransaction.expenses.length).toBe(1);

      //Clean up
      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
    });

    it('throws not found when transaction does not exist', async () => {
      await expect(
        service.update(
          testUsers.user1WithProperties.jwtUser,
          999,
          getTransactionIncome2(1),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when trying to update accepted transaction', async () => {
      const transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        getTransactionIncome1(1, TransactionStatus.ACCEPTED),
      );

      await expect(
        service.update(
          testUsers.user1WithProperties.jwtUser,
          transaction.id,
          getTransactionIncome2(1),
        ),
      ).rejects.toThrow(BadRequestException);

      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
    });

    describe('Common validation', () => {
      let transaction: Transaction;

      beforeAll(async () => {
        transaction = await addTransaction(
          app,
          mainUser.jwtUser,
          getTransactionIncome1(1),
        );
      });

      afterAll(async () => {
        await service.delete(mainUser.jwtUser, transaction.id);
      });

      it.each([
        [TransactionType.EXPENSE, getTransactionIncome1(1)],
        [TransactionType.INCOME, getTransactionExpense1(1)],
        [TransactionType.DEPOSIT, getTransactionIncome1(1)],
        [TransactionType.DEPOSIT, getTransactionExpense1(1)],
        [TransactionType.WITHDRAW, getTransactionIncome1(1)],
        [TransactionType.WITHDRAW, getTransactionExpense1(1)],
      ])(
        'throws when adding invalid data to %s transaction type',
        async (type, input) => {
          input.type = type;
          await expect(
            service.update(mainUser.jwtUser, transaction.id, input),
          ).rejects.toThrow(BadRequestException);
        },
      );
    });
  });

  describe('Delete', () => {
    it('deletes also expense row', async () => {
      let transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        getTransactionExpense1(1),
      );

      await sleep(20);
      const transactions = await service.search(
        testUsers.user1WithProperties.jwtUser,
        {
          relations: ['expenses'],
          where: {
            id: transaction.id,
          },
        },
      );

      //Delete transaction.
      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
      await sleep(50);

      const expense = await expenseService.findOne(
        testUsers.user1WithProperties.jwtUser,
        transactions[0].expenses[0].id,
      );
      expect(expense).toBeNull();

      transaction = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
      expect(transaction).toBeNull();
    });

    it('deletes also income row', async () => {
      let transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        getTransactionIncome2(1),
      );

      await sleep(20);
      const transactions = await service.search(
        testUsers.user1WithProperties.jwtUser,
        {
          relations: ['incomes'],
          where: {
            id: transaction.id,
          },
        },
      );

      //Delete transaction.
      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
      await sleep(50);

      const income = await expenseService.findOne(
        testUsers.user1WithProperties.jwtUser,
        transactions[0].incomes[0].id,
      );
      expect(income).toBeNull();

      transaction = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
      expect(transaction).toBeNull();
    });

    it('throws not found when transaction does not exist', async () => {
      await expect(
        service.delete(testUsers.user1WithProperties.jwtUser, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when not own transaction', async () => {
      const transaction = await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        getTransactionIncome1(1),
      );
      await expect(
        service.delete(testUsers.userWithoutProperties.jwtUser, transaction.id),
      ).rejects.toThrow(UnauthorizedException);

      await service.delete(
        testUsers.user1WithProperties.jwtUser,
        transaction.id,
      );
    });
  });

  describe('Search', () => {
    it.each([['userWithoutProperties']])(
      `does not return other's transactions`,
      async (user) => {
        const transactions = await service.search(testUsers[user].jwtUser, {});
        expect(transactions.length).toBe(0);
      },
    );

    it(`returns own transactions`, async () => {
      const transactions = await service.search(
        testUsers.user1WithProperties.jwtUser,
        {},
      );
      expect(transactions.length).toBe(12);
    });

    it.each([
      [{ id: 1 }, 1],
      [{ propertyId: 1 }, 6],
    ])(
      `returns own filtered transactions`,
      async (where: FindOptionsWhere<Transaction>, expectedLength: number) => {
        const transactions = await service.search(
          testUsers.user1WithProperties.jwtUser,
          { where: where },
        );
        expect(transactions.length).toBe(expectedLength);
      },
    );
  });

  describe('Accept and set type', () => {
    let transactions = [];
    beforeAll(async () => {
      await emptyTablesV2(app, ['transaction']);
      transactions = [
        getTransactionIncome1(1, TransactionStatus.PENDING),
        getTransactionIncome2(1, TransactionStatus.PENDING),
        getTransactionExpense1(1, TransactionStatus.PENDING),
      ];

      for (const transaction of transactions) {
        transaction.type = TransactionType.UNKNOWN;
        await service.add(mainUser.jwtUser, transaction);
      }
    });

    afterAll(async () => {
      for (const transactionId of [1, 2, 3]) {
        await service.delete(mainUser.jwtUser, transactionId);
      }
    });

    describe('Set type', () => {
      it('saves types for multiple transactions', async () => {
        const ids = [1, 2, 3];
        const result = await service.setType(
          testUsers.user1WithProperties.jwtUser,
          ids,
          TransactionType.INCOME,
        );

        await sleep(50);
        const savedTransactions = await service.search(
          testUsers.user1WithProperties.jwtUser,
          { where: { id: In(ids) } },
        );

        for (const transaction of savedTransactions) {
          expect(transaction.type).toBe(TransactionType.INCOME);
        }
        for (const resultItem of result.results) {
          expect(resultItem.statusCode).toBe(200);
        }
        expect(result.rows.total).toBe(3);
        expect(result.rows.success).toBe(3);
        expect(result.rows.failed).toBe(0);
      });

      it('throws if ids array is empty', async () => {
        await expect(
          service.setType(mainUser.jwtUser, [], TransactionType.INCOME),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws if type is not valid', async () => {
        await expect(
          service.setType(mainUser.jwtUser, [1], -1 as TransactionType),
        ).rejects.toThrow(BadRequestException);
      });

      it('returns 400 if transaction is accepted', async () => {
        const transaction = await addTransaction(
          app,
          testUsers.user1WithProperties.jwtUser,
          getTransactionIncome1(1, TransactionStatus.ACCEPTED),
        );

        const result = await service.setType(
          testUsers.user1WithProperties.jwtUser,
          [transaction.id],
          TransactionType.INCOME,
        );

        expect(result.results[0].statusCode).toBe(400);

        await service.delete(
          testUsers.user1WithProperties.jwtUser,
          transaction.id,
        );
      });
    });

    describe('Accept', () => {
      it('accepts multiple transactions', async () => {
        const ids = [1, 2, 3];
        const result = await service.accept(mainUser.jwtUser, ids);

        await sleep(50);
        const savedTransactions = await service.search(mainUser.jwtUser, {
          where: { id: In(ids) },
        });

        for (const transaction of savedTransactions) {
          expect(transaction.status).toBe(TransactionStatus.ACCEPTED);
        }
        for (const resultItem of result.results) {
          expect(resultItem.statusCode).toBe(200);
        }
        expect(result.rows.total).toBe(3);
        expect(result.rows.success).toBe(3);
        expect(result.rows.failed).toBe(0);
      });
    });
  });

  describe('Statistics', () => {
    it('calculate statistics correctly', async () => {
      await sleep(100);
      const statistics = await service.statistics(
        testUsers.user1WithProperties.jwtUser,
        { where: { propertyId: 1 } },
      );

      //expect(statistics.balance).toBe(2011.36);
      expect(statistics.totalIncomes).toBe(1339);
      expect(statistics.totalExpenses).toBe(227.64);
      expect(statistics.total).toBe(2011.36);
      expect(statistics.rowCount).toBe(6);
    });

    it('does not calculate other user statistics', async () => {
      const statistics = await service.statistics(
        testUsers.userWithoutProperties.jwtUser,
        { where: { propertyId: 1 } },
      );

      expect(statistics.balance).toBe(0);
      expect(statistics.totalExpenses).toBe(0);
      expect(statistics.totalIncomes).toBe(0);
      expect(statistics.total).toBe(0);
      expect(statistics.rowCount).toBe(0);
    });
  });
});
