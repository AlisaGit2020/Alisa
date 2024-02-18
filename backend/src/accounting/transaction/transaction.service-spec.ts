/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Between, DataSource, FindOperator } from 'typeorm';
import { AppModule } from 'src/app.module';
import { expenseTestData } from 'test/data/accounting/expense.test.data';
import { incomeTestData } from 'test/data/accounting/income.test.data';
import { TransactionService } from './transaction.service';
import { ExpenseService } from '../expense/expense.service';
import { IncomeService } from '../income/income.service';

describe('Transaction service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: TransactionService;
  let expenseService: ExpenseService;
  let incomeService: IncomeService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    [
      'expense',
      'expense_type',
      'income',
      'income_type',
      'property',
      'transaction',
    ].map(async (tableName) => {
      await dataSource.query(
        `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`,
      );
    });
  });

  describe('delete', () => {
    it('deletes also expense row', async () => {
      const expenseInput = expenseTestData.inputPost;
      await expenseService.add(expenseInput);

      const savedExpence = await expenseService.findOne(1);
      const transactionId = savedExpence.transactionId;

      //Delete transaction.
      await service.delete(transactionId);

      const expense = await expenseService.findOne(savedExpence.id);
      expect(expense).toBeNull();

      const transaction = await service.findOne(transactionId);
      expect(transaction).toBeNull();
    });

    it('deletes also income row', async () => {
      const incomeInput = incomeTestData.inputPost;
      await incomeService.add(incomeInput);

      const savedExpence = await incomeService.findOne(1);
      const transactionId = savedExpence.transactionId;

      //Delete transaction.
      await service.delete(transactionId);

      const income = await incomeService.findOne(savedExpence.id);
      expect(income).toBeNull();

      const transaction = await service.findOne(transactionId);
      expect(transaction).toBeNull();
    });
  });
});
