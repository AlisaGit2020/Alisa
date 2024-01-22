/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { ExpenseService } from './expense.service';
import { PropertyService } from 'src/real-estate/property/property.service';
import { ExpenseTypeService } from './expense-type.service';
import { expenseTestData } from 'test/data/accounting/expense.test.data';
import { startOfDay } from 'date-fns';
import { TransactionService } from '../transaction/transaction.service';

describe('Expense service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: ExpenseService;
  let propertyService: PropertyService;
  let expenseTypeService: ExpenseTypeService;
  let transactionService: TransactionService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<ExpenseService>(ExpenseService);
    propertyService = app.get<PropertyService>(PropertyService);
    expenseTypeService = app.get<ExpenseTypeService>(ExpenseTypeService);
    transactionService = app.get<TransactionService>(TransactionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ['expense, expense_type', 'property', 'transaction'].map((tableName) => {
      dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
    });
  });

  describe('update an expense', () => {
    it('update expense and add no new transaction', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 });
      await expenseTypeService.add({
        name: 'Expense type1',
        description: '',
        isTaxDeductible: true,
      });

      await service.add({
        expenseTypeId: 1,
        transaction: {
          amount: 10,
          accountingDate: startOfDay(new Date('2014-06-06')),
          transactionDate: startOfDay(new Date('2016-06-07')),
          description: '',
          quantity: 1,
          totalAmount: 10,
        },
        propertyId: 1,
      });

      await service.update(1, {
        expenseTypeId: 1,
        transaction: {
          amount: 99,
          accountingDate: startOfDay(new Date('2014-06-06')),
          transactionDate: startOfDay(new Date('2016-06-07')),
          description: '',
          quantity: 1,
          totalAmount: 99,
        },
        propertyId: 1,
      });

      const expense = await service.findOne(1, {
        relations: { transaction: true },
      });
      expect(expense.transaction.id).toBe(1);
      expect(expense.transaction.amount).toBe(99);
      expect(expense.transaction.totalAmount).toBe(-99);
    });
  });

  describe('find expenses', () => {
    it('finds expenses by property', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 });
      await propertyService.add({ name: 'Radiotie 6', size: 29 });
      await propertyService.add({ name: 'Aurora', size: 36.5 });

      await expenseTypeService.add({
        name: 'Expense type1',
        description: '',
        isTaxDeductible: true,
      });

      const propertyIdArray = [1, 1, 1, 1, 2, 2, 3];

      await Promise.all(
        propertyIdArray.map(async (propertyId) => {
          await service.add({
            expenseTypeId: 1,
            transaction: {
              amount: 10,
              accountingDate: startOfDay(new Date('2014-06-06')),
              transactionDate: startOfDay(new Date('2016-06-07')),
              description: '',
              quantity: 1,
              totalAmount: 10,
            },
            propertyId: propertyId,
          });
        }),
      );

      const expenses = await service.search({ where: { property: { id: 1 } } });

      expect(expenses.length).toBe(4);
    });
  });

  describe('add new expense', () => {
    it('sets transaction total amount as a negative number', async () => {
      const expense = expenseTestData.inputPost;

      await service.add(expense);

      const savedExpence = await service.findOne(1, {
        relations: { transaction: true },
      });

      expect(savedExpence.transaction.totalAmount).toBe(-39.64);
    });
  });

  describe('delete', () => {
    it('deletes also transaction row', async () => {
      const expense = expenseTestData.inputPost;
      await service.add(expense);

      let savedExpence = await service.findOne(1);
      const transactionId = savedExpence.transactionId;

      await service.delete(savedExpence.id);

      const transaction = await transactionService.findOne(transactionId);
      expect(transaction).toBeNull();

      savedExpence = await service.findOne(1);
      expect(savedExpence).toBeNull();
    });
  });
});
