/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { OpImportService } from '@alisa-backend/import/op/op-import.service';
import { MOCKS_PATH } from '@alisa-backend/constants';
import { OpImportInput } from '@alisa-backend/import/op/dtos/op-import-input.dto';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addIncomeAndExpenseTypes,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';

describe('Transaction search', () => {
  let app: INestApplication;
  let server: http.Server;
  let token: string;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    const opImportService = app.get(OpImportService);
    const authService = app.get(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    token = await getUserAccessToken2(authService, mainUser.jwtUser);

    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);

    const input: OpImportInput = {
      propertyId: 1,
      file: `${MOCKS_PATH}/import/op.transactions.csv`,
    };
    await opImportService.importCsv(mainUser.jwtUser, input);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  it(`returns all transactions`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search`)
      .set('Authorization', getBearerToken(token))
      .expect(200);

    expect(response.body.length).toBe(20);
  });

  it(`filters transaction date correctly`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search`)
      .set('Authorization', getBearerToken(token))
      .send({
        where: {
          transactionDate: {
            $between: [new Date('2023-12-01'), new Date('2023-12-04')],
          },
        },
      })
      .expect(200);
    expect(response.body.length).toBe(4);
  });

  it.each([
    [1, 20],
    [2, 0],
  ])(
    `filters by property correctly`,
    async (propertyId: number, expectedCount: number) => {
      const response = await request(server)
        .post(`/accounting/transaction/search`)
        .set('Authorization', getBearerToken(token))
        .send({
          where: { propertyId: propertyId },
        })
        .expect(200);
      expect(response.body.length).toBe(expectedCount);
    },
  );

  it.each([[['expense', 'income'], { expense: true, income: true }]])(
    `fetch statistics correctly with filter`,
    async (relations) => {
      const transactionDateFilter = {
        transactionDate: {
          $between: [new Date('2023-12-01'), new Date('2023-12-22')],
        },
      };

      const response = await request(server)
        .post(`/accounting/transaction/search/statistics`)
        .set('Authorization', getBearerToken(token))
        .send({
          relations: relations,
          where: { propertyId: 1, ...transactionDateFilter },
        })
        .expect(200);

      expect(response.body.rowCount).toBe(0);
      expect(response.body.totalExpenses).toBe(0);
      expect(response.body.totalIncomes).toBe(0);
      expect(response.body.total).toBe(0);
    },
  );

  it(`fetch statistics correctly without filter`, async () => {
    const response = await request(server)
      .post(`/accounting/transaction/search/statistics`)
      .set('Authorization', getBearerToken(token))
      .expect(200);
    expect(response.body.rowCount).toBe(0);
    expect(response.body.totalExpenses).toBe(0);
    expect(response.body.totalIncomes).toBe(0);
    expect(response.body.total).toBe(0);
  });
});
