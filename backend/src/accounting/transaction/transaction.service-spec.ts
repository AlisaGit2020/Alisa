/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { expenseTestData } from 'test/data/accounting/expense.test.data';
import { incomeTestData } from 'test/data/accounting/income.test.data';
import { TransactionService } from './transaction.service';
import { ExpenseService } from '../expense/expense.service';
import { IncomeService } from '../income/income.service';
import { UserService } from '@alisa-backend/people/user/user.service';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { jwtUser1, jwtUser2, jwtUser3 } from 'test/data/mocks/user.mock';
import { addProperty, emptyTables, sleep } from 'test/helper-functions';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';

describe('Transaction service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: TransactionService;
  let expenseService: ExpenseService;
  let incomeService: IncomeService;
  let userService: UserService;
  let propertyService: PropertyService;
  let user2: User;
  let user3: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<TransactionService>(TransactionService);
    expenseService = app.get<ExpenseService>(ExpenseService);
    incomeService = app.get<IncomeService>(IncomeService);
    userService = app.get<UserService>(UserService);
    propertyService = app.get<PropertyService>(PropertyService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic functions', () => {
    beforeEach(async () => {
      await emptyTables(dataSource);
    });

    describe('delete', () => {
      it('deletes also expense row', async () => {
        const expenseInput = expenseTestData.inputPost;
        const savedExpense = await expenseService.add(expenseInput);

        const transactionId = savedExpense.transactionId;

        //Delete transaction.
        await service.delete(transactionId);
        await sleep(50);

        const expense = await expenseService.findOne(savedExpense.id);
        expect(expense).toBeNull();

        const transaction = await service.findOne(transactionId);
        expect(transaction).toBeNull();
      });

      it('deletes also income row', async () => {
        const incomeInput = incomeTestData.inputPost;
        const savedIncome = await incomeService.add(incomeInput);
        await sleep(20);

        const transactionId = savedIncome.transactionId;

        //Delete transaction.
        await service.delete(transactionId);
        await sleep(50);

        const income = await incomeService.findOne(savedIncome.id);
        expect(income).toBeNull();

        const transaction = await service.findOne(transactionId);
        expect(transaction).toBeNull();
      });
    });

    describe('statistics', () => {
      it('calculate statistics correctly', async () => {
        const expenseInput = expenseTestData.inputPost;
        await expenseService.add(expenseInput);

        const incomeInput = incomeTestData.inputPost;
        incomeInput.transaction.id = 2;
        await incomeService.add(incomeInput);
        await sleep(20);
        const statistics = await service.statistics({});

        expect(statistics.totalExpenses).toBe(39.64);
        expect(statistics.totalIncomes).toBe(39.64);
        expect(statistics.total).toBe(0);
        expect(statistics.rowCount).toBe(2);
      });
    });
  });

  describe('Authorize and authentication stuff', () => {
    beforeAll(async () => {
      await emptyTables(dataSource);

      await userService.add(jwtUser1);
      user2 = await userService.add(jwtUser2);
      user3 = await userService.add(jwtUser3);

      jwtUser2.id = user2.id;
      jwtUser3.id = user3.id;

      const property = await addProperty(
        propertyService,
        'Test property',
        29,
        jwtUser2,
      );
      await sleep(50);

      const expenseInput = expenseTestData.inputPost;
      expenseInput.property = property;
      await expenseService.add(expenseInput);

      const incomeInput = incomeTestData.inputPost;
      incomeInput.property = property;
      await incomeService.add(incomeInput);
    });

    it.each([[jwtUser1], [jwtUser3]])(
      `does not return other's transactions`,
      async (jwtUser) => {
        const transactions = await service.search(jwtUser, {});
        expect(transactions.length).toBe(0);
      },
    );

    it(`returns own transactions`, async () => {
      const transactions = await service.search(jwtUser2, {});
      expect(transactions.length).toBe(2);
    });
  });
});
