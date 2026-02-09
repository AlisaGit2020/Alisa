import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addTransaction,
  addTransactionsToTestUsers,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  sleep,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { getTransactionIncome1 } from './data/mocks/transaction.mock';
import { TransactionStatus } from '@alisa-backend/common/types';
import * as http from 'http';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { startOfDay } from 'date-fns';

// Test data for income
const getIncomeInputPost = (propertyId: number): IncomeInputDto => ({
  incomeTypeId: 1,
  propertyId,
  description: 'Siivous',
  amount: 39.64,
  quantity: 1,
  totalAmount: 39.64,
  transaction: {
    status: TransactionStatus.ACCEPTED,
    externalId: '123',
    sender: 'Aurora',
    receiver: 'Bolag asuntoyhtiö Oy',
    description: 'Siivousmaksu',
    transactionDate: startOfDay(new Date('2023-01-31')),
    accountingDate: startOfDay(new Date('2023-02-28')),
    amount: 39.64,
  } as TransactionInputDto,
});

const getIncomeInputPut = (propertyId: number): IncomeInputDto => ({
  description: 'Yhtiövastike',
  amount: 94,
  quantity: 2,
  totalAmount: 188,
  propertyId,
  transaction: {
    id: 1,
    status: TransactionStatus.ACCEPTED,
    externalId: '124',
    sender: 'Yrjöntie',
    receiver: 'Espoon kaupunki',
    description: 'Yhtiövastike',
    transactionDate: startOfDay(new Date('2023-02-28')),
    accountingDate: startOfDay(new Date('2023-03-31')),
    amount: 188,
  } as TransactionInputDto,
});

describe('IncomeController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let mainUserToken: string;
  let noDataUserToken: string;
  let createdIncomeId: number;

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

  describe('POST /accounting/income/search', () => {
    it('returns 401 when not authenticated', () => {
      return request(server)
        .post('/accounting/income/search')
        .send({})
        .expect(401);
    });

    it('returns empty array for user without data', async () => {
      const response = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(noDataUserToken))
        .send({})
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('returns incomes for authenticated user', async () => {
      const response = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({})
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('excludes incomes with pending transaction from search results', async () => {
      const user = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      // Types are already added in beforeAll via addTransactionsToTestUsers

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

      // All returned incomes should have ACCEPTED status
      response.body.forEach((income: Income) => {
        expect(income.transaction.status).toBe(TransactionStatus.ACCEPTED);
      });
    });
  });

  describe('GET /accounting/income/default', () => {
    it('returns default income values', async () => {
      const response = await request(server)
        .get('/accounting/income/default')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /accounting/income/:id', () => {
    it('returns 401 when not authenticated', () => {
      return request(server).get('/accounting/income/1').expect(401);
    });

    it('returns 401 when accessing other users data', async () => {
      // Get an income from mainUser
      const searchResponse = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({})
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const incomeId = searchResponse.body[0].id;

      // Try to access with noDataUser
      return request(server)
        .get(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(noDataUserToken))
        .expect(401);
    });

    it('returns 404 for non-existent income', () => {
      return request(server)
        .get('/accounting/income/999999')
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns income when it exists', async () => {
      // Get an income from mainUser
      const searchResponse = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({})
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const incomeId = searchResponse.body[0].id;

      const response = await request(server)
        .get(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body.id).toBe(incomeId);
    });

    it('returns 404 when getting income with pending transaction', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[1].id;

      // Create income with PENDING transaction
      const transaction = await addTransaction(
        app,
        user.jwtUser,
        getTransactionIncome1(propertyId, TransactionStatus.PENDING),
      );

      const incomeId = transaction.incomes[0].id;

      await request(server)
        .get(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns income when its transaction is accepted', async () => {
      const user = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[1].id;

      // Create income with ACCEPTED transaction
      // Types are already added in beforeAll via addTransactionsToTestUsers
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

  describe('POST /accounting/income', () => {
    it('creates a new income', async () => {
      const inputPost = getIncomeInputPost(mainUser.properties[0].id);

      const response = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(inputPost)
        .expect(201);

      createdIncomeId = response.body.id;
      expect(createdIncomeId).toBeGreaterThan(0);
      expect(response.body.description).toBe(inputPost.description);
    });
  });

  describe('PUT /accounting/income/:id', () => {
    it('returns 401 when not authenticated', () => {
      return request(server)
        .put('/accounting/income/1')
        .send({})
        .expect(401);
    });

    it('returns 401 when updating other users data', async () => {
      // Get an income from mainUser
      const searchResponse = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({})
        .expect(200);

      const incomeId = searchResponse.body[0].id;
      const inputPut = getIncomeInputPut(mainUser.properties[0].id);

      return request(server)
        .put(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(noDataUserToken))
        .send(inputPut)
        .expect(401);
    });

    it('updates an income', async () => {
      const inputPut = getIncomeInputPut(mainUser.properties[0].id);

      const response = await request(server)
        .put(`/accounting/income/${createdIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(inputPut)
        .expect(200);

      expect(response.body.description).toBe(inputPut.description);
      expect(response.body.amount).toBe(inputPut.amount);
    });
  });

  describe('DELETE /accounting/income/:id', () => {
    it('returns 401 when not authenticated', () => {
      return request(server).delete('/accounting/income/1').expect(401);
    });

    it('returns 401 when deleting other users data', async () => {
      // Get an income from mainUser
      const searchResponse = await request(server)
        .post('/accounting/income/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({})
        .expect(200);

      const incomeId = searchResponse.body[0].id;

      return request(server)
        .delete(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(noDataUserToken))
        .expect(401);
    });

    it('deletes an income', async () => {
      await request(server)
        .delete(`/accounting/income/${createdIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200)
        .expect('true');

      // Verify it's deleted
      await request(server)
        .get(`/accounting/income/${createdIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });
  });
});
