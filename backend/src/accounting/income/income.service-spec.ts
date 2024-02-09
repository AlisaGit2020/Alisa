/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { IncomeService } from './income.service';
import { PropertyService } from 'src/real-estate/property/property.service';
import { IncomeTypeService } from './income-type.service';
import { incomeTestData } from 'test/data/accounting/income.test.data';
import { startOfDay } from 'date-fns';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionInputDto } from '../transaction/dtos/transaction-input.dto';

describe('Income service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: IncomeService;
  let propertyService: PropertyService;
  let incomeTypeService: IncomeTypeService;
  let transactionService: TransactionService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<IncomeService>(IncomeService);
    propertyService = app.get<PropertyService>(PropertyService);
    incomeTypeService = app.get<IncomeTypeService>(IncomeTypeService);
    transactionService = app.get<TransactionService>(TransactionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ['income, income_type', 'property', 'transaction'].map((tableName) => {
      dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
    });
  });

  describe('update an income', () => {
    it('update income and add no new transaction', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 });
      await incomeTypeService.add({
        name: 'Income type1',
        description: '',
      });

      await service.add({
        incomeTypeId: 1,
        transaction: {
          sender: 'Yrjöntie',
          receiver: 'Espoon kaupunki',
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
        incomeTypeId: 1,
        transaction: {
          sender: 'Yrjöntie',
          receiver: 'Espoon kaupunki',
          amount: 99,
          accountingDate: startOfDay(new Date('2014-06-06')),
          transactionDate: startOfDay(new Date('2016-06-07')),
          description: '',
          quantity: 1,
          totalAmount: 99,
        },
        propertyId: 1,
      });

      const income = await service.findOne(1, {
        relations: { transaction: true },
      });
      expect(income.transaction.id).toBe(1);
      expect(income.transaction.amount).toBe(99);
      expect(income.transaction.totalAmount).toBe(99);
    });
  });

  describe('find incomes', () => {
    it('finds incomes by property', async () => {
      await propertyService.add({ name: 'Yrjöntie 1', size: 59.5 });
      await propertyService.add({ name: 'Radiotie 6', size: 29 });
      await propertyService.add({ name: 'Aurora', size: 36.5 });

      await incomeTypeService.add({
        name: 'Income type1',
        description: '',
      });

      const propertyIdArray = [1, 1, 1, 1, 2, 2, 3];

      await Promise.all(
        propertyIdArray.map(async (propertyId) => {
          await service.add({
            incomeTypeId: 1,
            transaction: {
              sender: 'Yrjöntie',
              receiver: 'Espoon kaupunki',
              amount: 10,
              accountingDate: startOfDay(new Date('2014-06-06')),
              transactionDate: startOfDay(new Date('2016-06-07')),
              description: '',
              quantity: 1,
              totalAmount: 10,
            } as TransactionInputDto,
            propertyId: propertyId,
          });
        }),
      );

      const incomes = await service.search({ where: { property: { id: 1 } } });

      expect(incomes.length).toBe(4);
    });
  });

  describe('delete', () => {
    it('deletes also transaction row', async () => {
      const income = incomeTestData.inputPost;
      await service.add(income);

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
