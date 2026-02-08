/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { propertyTestData } from './data/real-estate/property.test.data';
import { TestData } from './data/test-data';
import { expenseTestData } from './data/accounting/expense.test.data';
import { expenseTypeTestData } from './data/accounting/expense-type.test.data';
import { transactionTestData } from './data/accounting/transaction.test.data';
import { incomeTypeTestData } from './data/accounting/income-type.test.data';
import { incomeTestData } from './data/accounting/income.test.data';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addTransactionsToTestUsers,
  closeAppGracefully,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';

describe('Global controller end-to-end test (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let mainUserToken: string;
  let noDataUserToken: string;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let createdId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    authService = app.get<AuthService>(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    mainUserToken = await getUserAccessToken2(authService, mainUser.jwtUser);
    noDataUserToken = await getUserAccessToken2(
      authService,
      testUsers.userWithoutProperties.jwtUser,
    );

    await addTransactionsToTestUsers(app, testUsers);
    await sleep(50);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe.each([
    [expenseTestData],
    [expenseTypeTestData],
    [incomeTypeTestData],
    [incomeTestData],
    [propertyTestData],
    [transactionTestData],
  ])('Api endpoints', (testData: TestData) => {
    describe(`${testData.name}`, () => {
      describe('Authorization', () => {
        it(`GET ${testData.baseUrlWithId}, fails when not authenticated`, () => {
          return request(server).get(testData.baseUrlWithId).expect(401);
        });

        it(`PUT ${testData.baseUrlWithId}, fails when not authenticated`, () => {
          return request(server).put(testData.baseUrlWithId).expect(401);
        });

        it(`DELETE ${testData.baseUrlWithId}, fails when not authenticated`, () => {
          return request(server).delete(testData.baseUrlWithId).expect(401);
        });

        it(`POST ${testData.baseUrl}/search, fails when not authenticated`, () => {
          return request(server).post(`${testData.baseUrl}/search`).expect(401);
        });
      });

      describe('No access to other user data', () => {
        it(`GET ${testData.baseUrlWithId}, fails when not own data`, () => {
          return request(server)
            .get(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${noDataUserToken}`)
            .expect(401);
        });

        it(`DELETE ${testData.baseUrlWithId}, fails when not data`, () => {
          return request(server)
            .delete(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${noDataUserToken}`)
            .expect(401);
        });

        it(`SEARCH ${testData.baseUrl}/search, returns no items`, async () => {
          const response = await request(server)
            .post(`${testData.baseUrl}/search`)
            .set('Authorization', `Bearer ${noDataUserToken}`)
            .send(testData.searchOptions)
            .expect(200);

          expect(response.body.length).toBe(0);
        });
      });

      if (testData.hasDefault) {
        it(`GET ${testData.baseUrl}/default, get default items`, () => {
          return request(server)
            .get(`${testData.baseUrl}/default`)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .expect(200);
        });
      }

      if (testData.inputPost) {
        it(`POST ${testData.baseUrl}, add a new item`, async () => {
          const response = await request(server)
            .post(testData.baseUrl)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .send(testData.inputPost)
            .expect(201);

          createdId = response.body.id;
          expect(createdId).toBeGreaterThan(0);
        });

        it(`GET ${testData.baseUrlWithId}, get single item`, () => {
          return request(server)
            .get(testData.baseUrlWithId)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .expect(200);
        });

        it(`GET ${testData.baseUrl}/999, throws when single item not exist`, () => {
          return request(server)
            .get(`${testData.baseUrl}/999`)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .expect(404);
        });

        it(`PUT ${testData.baseUrl}/<createdId>, update an item`, () => {
          return request(server)
            .put(`${testData.baseUrl}/${createdId}`)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .send(testData.inputPut)
            .expect(200);
        });

        it(`DELETE ${testData.baseUrl}, delete an item`, () => {
          return request(server)
            .delete(`${testData.baseUrl}/${createdId}`)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .expect(200)
            .expect('true');
        });
      }

      if (testData.searchOptions) {
        const searchUrl = `${testData.baseUrl}/search`;
        it(`SEARCH ${searchUrl}, search items`, () => {
          return request(server)
            .post(searchUrl)
            .set('Authorization', `Bearer ${mainUserToken}`)
            .send(testData.searchOptions)
            .expect(200);
        });
      }
    });
  });
});
