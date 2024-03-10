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
import { ExpenseService } from './expense.service';
import { expenseTestData } from 'test/data/accounting/expense.test.data';
import { startOfDay } from 'date-fns';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';

import {
  addTransactionsToTestUsers,
  getTestUsers,
  prepareDatabase,
  sleep,
  TestUsersSetup,
} from '../../../test/helper-functions';

describe('Expense service', () => {
  let app: INestApplication;
  let service: ExpenseService;

  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<ExpenseService>(ExpenseService);
    transactionService = app.get<TransactionService>(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    await addTransactionsToTestUsers(app, testUsers);
  });

  afterAll(async () => {
    await app.close();
  });

  const addExpense = async () => {
    return service.add(testUsers.user1WithProperties.jwtUser, {
      quantity: 0,
      totalAmount: 0,
      propertyId: 1,
      expenseTypeId: 1,
      amount: 100,
      description: 'Yhtiövastike',
      transaction: {
        sender: 'John Doe',
        receiver: 'Espoon kaupunki',
        accountingDate: startOfDay(new Date()),
        transactionDate: startOfDay(new Date()),
        amount: 100,
        description: 'Yhtiövastike',
        propertyId: 1,
      } as TransactionInputDto,
    });
  };

  const deleteExpense = async (expenseId: number) => {
    try {
      await service.delete(testUsers.user1WithProperties.jwtUser, expenseId);
    } catch (e) {}
  };

  describe('Create', () => {
    let expenseId: number;
    afterAll(async () => {
      await deleteExpense(expenseId);
    });
    it('adds a new expense to user', async () => {
      const savedExpense = await addExpense();
      expenseId = savedExpense.id; //For cleanup
      expect(savedExpense.description).toBe('Yhtiövastike');
      expect(savedExpense.transaction.sender).toBe('John Doe');
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      const input = expenseTestData.inputPost;
      await expect(
        service.add(testUsers.user2WithProperties.jwtUser, input),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Read', () => {
    it('finds one expense', async () => {
      const expense = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        1,
      );
      expect(expense.id).toBe(1);
    });

    it('returns null if expense does not exist', async () => {
      const expense = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        999,
      );
      expect(expense).toBeNull();
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      await expect(
        service.findOne(testUsers.user2WithProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update', () => {
    let expenseId: number;
    beforeAll(async () => {
      const savedExpense = await addExpense();
      expenseId = savedExpense.id;
    });
    afterAll(async () => {
      await deleteExpense(expenseId);
    });
    it('update expense', async () => {
      await service.update(
        testUsers.user1WithProperties.jwtUser,
        expenseId,
        expenseTestData.inputPut,
      );

      const expense = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        expenseId,
        {
          relations: { transaction: true },
        },
      );
      expect(expense.description).toBe('Yhtiövastike');
    });

    it('throws NotFoundException if expense does not exist', async () => {
      await expect(
        service.update(
          testUsers.user1WithProperties.jwtUser,
          999,
          expenseTestData.inputPut,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException if user does not have access to property', async () => {
      const input = expenseTestData.inputPut;
      await expect(
        service.update(
          testUsers.userWithoutProperties.jwtUser, // This user does not own any properties
          testUsers.user1WithProperties.properties[0].id, // This property is owned by user1
          input,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Delete', () => {
    let transactionId: number;
    let expenseId: number;

    beforeEach(async () => {
      const savedExpense = await addExpense();
      expenseId = savedExpense.id;
      transactionId = savedExpense.transactionId;
    });

    afterEach(async () => {
      try {
        await service.delete(testUsers.user1WithProperties.jwtUser, expenseId);
      } catch (e) {}
    });

    it('it deletes expense row, but not transaction row', async () => {
      await service.delete(testUsers.user1WithProperties.jwtUser, expenseId);
      await sleep(20);

      const transaction = await transactionService.findOne(
        testUsers.user1WithProperties.jwtUser,
        transactionId,
      );
      expect(transaction.id).toBeGreaterThanOrEqual(1);

      const savedExpense = await service.findOne(
        testUsers.user1WithProperties.jwtUser,
        expenseId,
      );
      expect(savedExpense).toBeNull();
    });

    it('throws NotFoundException if expense does not exist', async () => {
      await expect(
        service.delete(testUsers.user1WithProperties.jwtUser, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([['userWithoutProperties'], ['user2WithProperties']])(
      'throws UnauthorizedException if user does not have access to property',
      async (user: keyof TestUsersSetup) => {
        await expect(
          service.delete(testUsers[user].jwtUser, expenseId),
        ).rejects.toThrow(UnauthorizedException);
      },
    );
  });

  describe('Search', () => {
    it('can search own properties', async () => {
      const expenses = await service.search(
        testUsers.user1WithProperties.jwtUser,
        { where: { property: { id: 1 } } },
      );

      expect(expenses.length).toBe(3);
    });

    it.each([
      ['userWithoutProperties', { property: { id: 3 } }],
      ['user2WithProperties', { property: { id: 1 } }],
      ['userWithoutProperties', undefined],
    ])(
      `Does not return other user's properties`,
      async (user: string, where: object | undefined) => {
        const expenses = await service.search(testUsers[user].jwtUser, {
          where: where,
        });

        expect(expenses.length).toBe(0);
      },
    );
  });
});
