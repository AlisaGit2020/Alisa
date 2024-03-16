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
import { ExpenseService } from '../expense/expense.service';

import {
  addIncomeAndExpenseTypes,
  addTransaction,
  addTransactionsToTestUsers,
  emptyTables,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import {
  getTransactionExpense1,
  getTransactionExpense2,
  getTransactionIncome1,
  getTransactionIncome2,
} from '../../../test/data/mocks/transaction.mock';
import { DataSource, FindOptionsWhere } from 'typeorm';

describe('Transaction service', () => {
  let app: INestApplication;
  let service: TransactionService;
  let testUsers: TestUsersSetup;
  let expenseService: ExpenseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<TransactionService>(TransactionService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic tests', () => {
    beforeAll(async () => {
      expenseService = app.get<ExpenseService>(ExpenseService);

      await prepareDatabase(app);
      testUsers = await getTestUsers(app);
      await addTransactionsToTestUsers(app, testUsers);
    });

    describe('Create', () => {
      it('does not allow add a transaction for another user property', async () => {
        const input = getTransactionIncome1(1);
        await expect(
          service.add(testUsers.userWithoutProperties.jwtUser, input),
        ).rejects.toThrow(UnauthorizedException);
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
          getTransactionIncome1(1),
        );

        const input = {
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

      it('throws not found when transaction does not exist', async () => {
        await expect(
          service.update(
            testUsers.user1WithProperties.jwtUser,
            999,
            getTransactionIncome2(1),
          ),
        ).rejects.toThrow(NotFoundException);
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
          service.delete(
            testUsers.userWithoutProperties.jwtUser,
            transaction.id,
          ),
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
          const transactions = await service.search(
            testUsers[user].jwtUser,
            {},
          );
          expect(transactions.length).toBe(0);
        },
      );

      it(`returns own transactions`, async () => {
        const transactions = await service.search(
          testUsers.user1WithProperties.jwtUser,
          {},
        );
        expect(transactions.length).toBe(8);
      });

      it.each([
        [{ id: 1 }, 1],
        [{ propertyId: 1 }, 4],
      ])(
        `returns own filtered transactions`,
        async (
          where: FindOptionsWhere<Transaction>,
          expectedLength: number,
        ) => {
          const transactions = await service.search(
            testUsers.user1WithProperties.jwtUser,
            { where: where },
          );
          expect(transactions.length).toBe(expectedLength);
        },
      );
    });

    describe('Statistics', () => {
      it('calculate statistics correctly', async () => {
        const statistics = await service.statistics(
          testUsers.user1WithProperties.jwtUser,
          { where: { propertyId: 1 } },
        );

        expect(statistics.totalExpenses).toBe(227.64);
        expect(statistics.totalIncomes).toBe(1339);
        expect(statistics.total).toBe(1111.36);
        expect(statistics.rowCount).toBe(4);
      });

      it('does not calculate other user statistics', async () => {
        const statistics = await service.statistics(
          testUsers.userWithoutProperties.jwtUser,
          { where: { propertyId: 1 } },
        );

        expect(statistics.totalExpenses).toBe(0);
        expect(statistics.totalIncomes).toBe(0);
        expect(statistics.total).toBe(0);
        expect(statistics.rowCount).toBe(0);
      });
    });
  });

  describe('Balance', () => {
    let mainUser: TestUser;

    beforeAll(async () => {
      await prepareDatabase(app);
      testUsers = await getTestUsers(app);
      await addIncomeAndExpenseTypes(app);
      mainUser = testUsers.user1WithProperties;
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
          await service.update(mainUser.jwtUser, transactionId, {
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

      //Todo: Implement this test.
      it.skip('gets balance correctly when the property change', async () => {});

      it.each([
        [1, 862.36],
        [2, 21.36],
        [3, 1151],
        [4, 1299.36],
      ])(
        'gets balance correctly when delete a transaction',
        async (transactionId: number, expectedBalance) => {
          await addTransactions();
          await service.delete(mainUser.jwtUser, transactionId);
          const balance = await service.getBalance(mainUser.jwtUser, 1);
          expect(balance).toBe(expectedBalance);
        },
      );
    });
  });
});
