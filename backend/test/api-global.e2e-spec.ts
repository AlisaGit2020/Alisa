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
import { transactionTestData } from './data/accounting/transaction.test.data';

describe('Global controller end-to-end test (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = app.get(DataSource);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe.each([
    [propertyTestData],
    [expenseTestData],
    [expenseTypeTestData],
    [transactionTestData],
  ])('Api endpoints', (testData: TestData) => {
    describe(`${testData.name}`, () => {
      if (testData.inputPost) {
        it(`POST ${testData.baseUrl}, add a new item`, () => {
          testData.tables.map((tableName) => {
            dataSource.query(
              `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`,
            );
          });

          return request(server)
            .post(testData.baseUrl)
            .send(testData.inputPost)
            .expect(201)
            .expect(testData.expected);
        });

        it(`GET ${testData.baseUrl}, gets list of items (GET)`, () => {
          return request(server)
            .get(testData.baseUrl)
            .expect(200)
            .expect([testData.expected]);
        });

        it(`GET ${testData.baseUrlWithId}, get single item`, () => {
          return request(server)
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

          return request(server)
            .put(testData.baseUrlWithId)
            .send(copyObject)
            .expect(200)
            .expect(testData.expected);
        });

        it(`PUT ${testData.baseUrlWithId}, update an item`, () => {
          return request(server)
            .put(testData.baseUrlWithId)
            .send(testData.inputPut)
            .expect(200)
            .expect(testData.expectedPut);
        });

        it(`DELETE ${testData.baseUrlWithId}, delete an item`, () => {
          return request(server)
            .delete(testData.baseUrlWithId)
            .expect(200)
            .expect('true');
        });

        it(`POST ${testData.baseUrl}, add 10 same items`, async () => {
          for (let i = 0; i < 10; i++) {
            await request(server)
              .post(testData.baseUrl)
              .send(testData.inputPost)
              .expect(201);
          }

          const response = await request(server).get(testData.baseUrl);
          expect(response.status).toBe(200);
          expect(response.body).toHaveLength(10);
        });
      }

      if (testData.searchOptions) {
        const searchUrl = `${testData.baseUrl}/search`;
        it(`SEARCH ${searchUrl}, search items`, () => {
          return request(server)
            .post(searchUrl)
            .send(testData.searchOptions)
            .expect(200);
        });
      }
    });
  });
});
