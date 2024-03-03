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
import { incomeTypeTestData } from './data/accounting/income-type.test.data';
import { incomeTestData } from './data/accounting/income.test.data';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { getUserAccessToken } from './helper-functions';

describe('Global controller end-to-end test (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;
  let authService: AuthService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = app.get(DataSource);

    await app.init();
    server = app.getHttpServer();

    authService = app.get<AuthService>(AuthService);
    token = await getUserAccessToken(authService);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe.each([
    [expenseTestData],
    [expenseTypeTestData],
    [incomeTypeTestData],
    [incomeTestData],
    [transactionTestData],
  ])('Api endpoints', (testData: TestData) => {
    describe(`${testData.name}`, () => {
      it(`GET ${testData.baseUrlWithId}, fails when not authorized`, () => {
        return request(server).get(testData.baseUrlWithId).expect(401);
      });

      if (testData.inputPost) {
        it(`POST ${testData.baseUrl}, add a new item`, () => {
          testData.tables.map((tableName) => {
            dataSource.query(
              `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`,
            );
          });

          return request(server)
            .post(testData.baseUrl)
            .set('Authorization', `Bearer ${token}`)
            .send(testData.inputPost)
            .expect(201)
            .expect(testData.expected);
        });

        it(`GET ${testData.baseUrlWithId}, get single item`, () => {
          return request(server)
            .get(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
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
            .set('Authorization', `Bearer ${token}`)
            .send(copyObject)
            .expect(200);
        });

        it(`PUT ${testData.baseUrlWithId}, update an item`, () => {
          return request(server)
            .put(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${token}`)
            .send(testData.inputPut)
            .expect(200)
            .expect(testData.expectedPut);
        });

        it(`DELETE ${testData.baseUrlWithId}, delete an item`, () => {
          return request(server)
            .delete(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('true');
        });

        it(`POST ${testData.baseUrl}, add 10 same items`, async () => {
          for (let i = 0; i < 10; i++) {
            await request(server)
              .post(testData.baseUrl)
              .set('Authorization', `Bearer ${token}`)
              .send(testData.inputPost)
              .expect(201);
          }

          const response = await request(server)
            .get(testData.baseUrl)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(200);
          expect(response.body).toHaveLength(10);
        });
      }

      if (testData.searchOptions) {
        const searchUrl = `${testData.baseUrl}/search`;
        it(`SEARCH ${searchUrl}, search items`, () => {
          return request(server)
            .post(searchUrl)
            .set('Authorization', `Bearer ${token}`)
            .send(testData.searchOptions)
            .expect(200);
        });
      }
    });
  });
});
