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


describe('Expense service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: ExpenseService
  let propertyService: PropertyService
  let expenseTypeService: ExpenseTypeService

  beforeAll(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource)
    service = app.get<ExpenseService>(ExpenseService);
    propertyService = app.get<PropertyService>(PropertyService)
    expenseTypeService = app.get<ExpenseTypeService>(ExpenseTypeService)

  });

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    ['expense, expense_type', 'property', 'transaction'].map((tableName) => {
      dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
    });

  })

  describe('update an expense', () => {
    it('update expense and add no new transaction', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 })
      await expenseTypeService.add({ name: 'Expense type1', description: '', isTaxDeductible: true });

      await service.add({
        expenseType: 1,
        transaction: {
          amount: 10,
          accountingDate: '2014-06-06',
          transactionDate: '2016-06-07',
          description: '',
          quantity: 1,
          totalAmount: 10
        },
        property: 1
      });

      await service.update(1, {
        expenseType: 1,
        transaction: {
          amount: 99,
          accountingDate: '2014-06-06',
          transactionDate: '2016-06-07',
          description: '',
          quantity: 1,
          totalAmount: 99
        },
        property: 1
      });

      const expense = await service.findOne(1);
      expect(expense.transaction.id).toBe(1);
      expect(expense.transaction.amount).toBe(99);
      expect(expense.transaction.totalAmount).toBe(99);
    })
  })

  describe('find expenses', () => {
    it('finds expenses by property', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 })
      await propertyService.add({ name: 'Radiotie 6', size: 29 })
      await propertyService.add({ name: 'Aurora', size: 36.5 })

      await expenseTypeService.add({ name: 'Expense type1', description: '', isTaxDeductible: true });


      const propertyIdArray = [1, 1, 1, 1, 2, 2, 3];

      await Promise.all(
        propertyIdArray.map(async (propertyId) => {
          await service.add({
            expenseType: 1,
            transaction: {
              amount: 10,
              accountingDate: '2014-06-06',
              transactionDate: '2016-06-07',
              description: '',
              quantity: 1,
              totalAmount: 10
            },
            property: propertyId
          });
        })
      );

      const expenses = await service.search({ where: { property: { id: 1 } } })

      expect(expenses.length).toBe(4)
    })
  })

});
