/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { propertyTestData } from './data/real-estate/property.test.data';
import { TestData } from './data/test-data';
import { expenseTestData } from './data/accounting/expense.test.data';
import { expenseTypeTestData } from './data/accounting/expense-type.test.data';

describe('Global controller end-to-end test (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeEach(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = app.get(DataSource);

    await app.init();
  });

  describe.each([
    [propertyTestData],
    [expenseTestData],
    [expenseTypeTestData]
  ])('Api endpoints', (testData: TestData) => {

    describe(`${testData.name}`, () => {

      it(`POST ${testData.baseUrl}, add a new item`, () => {

        testData.tables.map((tableName) => {
          dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
        })

        return request(app.getHttpServer())
          .post(testData.baseUrl)
          .send(testData.inputPost)
          .expect(201)
          .expect(testData.expected);
      });

      it(`GET ${testData.baseUrl}, gets list of items (GET)`, () => {
        return request(app.getHttpServer())
          .get(testData.baseUrl)
          .expect(200)
          .expect([testData.expected]);
      });

      it(`GET ${testData.baseUrlWithId}, get single item`, () => {
        return request(app.getHttpServer())
          .get(testData.baseUrlWithId)
          .expect(200)
          .expect(testData.expected);
      });

      it(`PUT ${testData.baseUrlWithId}, does not update item properties when properties not given`, () => {
        //Set all values to undefined
        const copyObject = { ...testData.inputPost };
        for (const key in copyObject) {
          if (copyObject.hasOwnProperty(key)) {
            copyObject[key] = undefined;
          }
        }

        return request(app.getHttpServer())
          .put(testData.baseUrlWithId)
          .send(copyObject)
          .expect(200)
          .expect(testData.expected);
      });

      it(`PUT ${testData.baseUrlWithId}, update an item`, () => {

        return request(app.getHttpServer())
          .put(testData.baseUrlWithId)
          .send(testData.inputPut)
          .expect(200)
          .expect(testData.expectedPut);
      });

      it(`DELETE ${testData.baseUrlWithId}, delete an item`, () => {
        return request(app.getHttpServer())
          .delete(testData.baseUrlWithId)
          .expect(200)
          .expect('true');
      });
    })
  })

});
