/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Transaction } from 'typeorm';
import { AppModule } from 'src/app.module';
import { expenseTestData } from 'test/data/accounting/expense.test.data';
import { TransactionService } from './transaction.service';
import { ExpenseService } from '../expense/expense.service';

describe('Expense service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: TransactionService;
  let expenseService: ExpenseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<TransactionService>(TransactionService);
    expenseService = app.get<ExpenseService>(ExpenseService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ['expense, expense_type', 'property', 'transaction'].map((tableName) => {
      dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
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
  });
});
