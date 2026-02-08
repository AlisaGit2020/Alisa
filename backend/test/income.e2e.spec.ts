import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addIncomeAndExpenseTypes,
  addTransaction,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import {
  getTransactionIncome1,
} from './data/mocks/transaction.mock';
import { TransactionStatus } from '@alisa-backend/common/types';
import * as http from 'http';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';

describe('Income with transaction status (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    await addIncomeAndExpenseTypes(testUsers.user1WithProperties.jwtUser, app);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe('Income visibility based on transaction status', () => {
    it('excludes incomes with pending transaction from search results', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      // Create income with ACCEPTED transaction
      await addTransaction(
        app,
        user.jwtUser,
        getTransactionIncome1(propertyId, TransactionStatus.ACCEPTED),
      );

      // Create income with PENDING transaction
      await addTransaction(
        app,
        user.jwtUser,
        getTransactionIncome1(propertyId, TransactionStatus.PENDING),
      );

      const response = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(token))
        .send({ where: { propertyId } })
        .expect(200);

      // Only the incomes with ACCEPTED transaction should be returned
      // (getTransactionIncome1 creates 2 incomes per transaction)
      expect(response.body.length).toBe(2);
      response.body.forEach((income: Income) => {
        expect(income.transaction.status).toBe(TransactionStatus.ACCEPTED);
      });
    });

    it('returns 404 when getting income with pending transaction by id', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[1].id;

      // Create income with PENDING transaction
      const transaction = await addTransaction(
        app,
        user.jwtUser,
        getTransactionIncome1(propertyId, TransactionStatus.PENDING),
      );

      // Get the income ID from the transaction
      const incomeId = transaction.incomes[0].id;

      await request(server)
        .get(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns income when its transaction is accepted', async () => {
      const user = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      await addIncomeAndExpenseTypes(user.jwtUser, app);

      // Create income with ACCEPTED transaction
      const transaction = await addTransaction(
        app,
        user.jwtUser,
        getTransactionIncome1(propertyId, TransactionStatus.ACCEPTED),
      );

      const incomeId = transaction.incomes[0].id;

      const response = await request(server)
        .get(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(incomeId);
    });
  });
});
