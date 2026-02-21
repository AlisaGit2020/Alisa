import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { TransactionStatus, TransactionType } from '@alisa-backend/common/types';
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
  incomeTypeId: 1,
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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
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

    it('returns 400 when accountingDate is invalid', async () => {
      const inputPost = {
        ...getIncomeInputPost(mainUser.properties[0].id),
        accountingDate: 'Invalid Date',
      };

      const response = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send(inputPost)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('accountingDate')]),
      );
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

    it('deletes a standalone income', async () => {
      // Create a standalone income (without transaction) to delete
      const createResponse = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          incomeTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone income to delete',
          amount: 55,
          quantity: 1,
          totalAmount: 55,
        })
        .expect(201);

      const standaloneIncomeId = createResponse.body.id;

      await request(server)
        .delete(`/accounting/income/${standaloneIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200)
        .expect('true');

      // Verify it's deleted
      await request(server)
        .get(`/accounting/income/${standaloneIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 400 when income has a transaction relation', async () => {
      // Create income with transaction via HTTP
      const createResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Income Delete Prevention Test',
          receiver: 'Test Receiver',
          description: 'Transaction with income to test delete prevention',
          transactionDate: new Date('2024-03-01'),
          accountingDate: new Date('2024-03-01'),
          amount: 200,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.INCOME,
          externalId: `income-delete-prevention-${Date.now()}`,
          incomes: [
            {
              incomeTypeId: 1,
              description: 'Income with transaction',
              amount: 200,
              quantity: 1,
              totalAmount: 200,
            },
          ],
        })
        .expect(201);

      // Get the income ID from the transaction
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: createResponse.body.id },
          relations: { incomes: true },
        })
        .expect(200);

      const incomeId = searchResponse.body[0].incomes[0].id;

      // Try to delete the income - should be rejected
      const deleteResponse = await request(server)
        .delete(`/accounting/income/${incomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(400);

      expect(deleteResponse.body.message).toContain('transaction');
    });
  });

  describe('POST /accounting/income/delete (bulk delete)', () => {
    it('deletes multiple standalone incomes when user owns them', async () => {
      // Create standalone incomes (without transactions)
      const income1Response = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          incomeTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone income 1 for bulk delete',
          amount: 80,
          quantity: 1,
          totalAmount: 80,
        })
        .expect(201);

      const income2Response = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          incomeTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone income 2 for bulk delete',
          amount: 90,
          quantity: 1,
          totalAmount: 90,
        })
        .expect(201);

      const ids = [income1Response.body.id, income2Response.body.id];

      const response = await request(server)
        .post('/accounting/income/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
      expect(response.body.rows.total).toBe(2);
      expect(response.body.rows.success).toBe(2);
      expect(response.body.rows.failed).toBe(0);

      // Verify incomes are deleted
      await request(server)
        .get(`/accounting/income/${ids[0]}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
      await request(server)
        .get(`/accounting/income/${ids[1]}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 401 when not authenticated', () => {
      return request(server)
        .post('/accounting/income/delete')
        .send({ ids: [1, 2] })
        .expect(401);
    });

    it('returns 400 when ids array is empty', async () => {
      return request(server)
        .post('/accounting/income/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [] })
        .expect(400);
    });

    it('returns partial success when some incomes belong to other user', async () => {
      // Create standalone income for main user
      const mainUserIncomeResponse = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          incomeTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Main user standalone income for partial success test',
          amount: 110,
          quantity: 1,
          totalAmount: 110,
        })
        .expect(201);

      // Create standalone income for user2
      const user2 = testUsers.user2WithProperties;
      const user2Token = await getUserAccessToken2(authService, user2.jwtUser);
      const user2IncomeResponse = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(user2Token))
        .send({
          incomeTypeId: 1,
          propertyId: user2.properties[0].id,
          description: 'User2 standalone income for partial success test',
          amount: 120,
          quantity: 1,
          totalAmount: 120,
        })
        .expect(201);

      const ids = [mainUserIncomeResponse.body.id, user2IncomeResponse.body.id];

      const response = await request(server)
        .post('/accounting/income/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids })
        .expect(201);

      expect(response.body.allSuccess).toBe(false);
      expect(response.body.rows.success).toBe(1);
      expect(response.body.rows.failed).toBe(1);
    });

    it('returns 400 for incomes with transaction relation and deletes only standalone incomes', async () => {
      // Create a standalone income (without transaction)
      const standaloneIncomeResponse = await request(server)
        .post('/accounting/income')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          incomeTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone income for bulk delete test',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
        })
        .expect(201);

      const standaloneIncomeId = standaloneIncomeResponse.body.id;

      // Create an income with transaction
      const transactionResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Bulk Delete Prevention Test',
          receiver: 'Test Receiver',
          description: 'Transaction with income for bulk delete prevention',
          transactionDate: new Date('2024-03-02'),
          accountingDate: new Date('2024-03-02'),
          amount: 150,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.INCOME,
          externalId: `income-bulk-delete-prevention-${Date.now()}`,
          incomes: [
            {
              incomeTypeId: 1,
              description: 'Income with transaction for bulk delete',
              amount: 150,
              quantity: 1,
              totalAmount: 150,
            },
          ],
        })
        .expect(201);

      // Get the income ID from the transaction
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: transactionResponse.body.id },
          relations: { incomes: true },
        })
        .expect(200);

      const incomeWithTransactionId = searchResponse.body[0].incomes[0].id;

      // Try to bulk delete both - should succeed for standalone, fail for income with transaction
      const deleteResponse = await request(server)
        .post('/accounting/income/delete')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [standaloneIncomeId, incomeWithTransactionId] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.rows.success).toBe(1);
      expect(deleteResponse.body.rows.failed).toBe(1);

      // The failed one should have 400 status code
      const failedResult = deleteResponse.body.results.find(
        (r: { id: number; statusCode: number }) => r.id === incomeWithTransactionId,
      );
      expect(failedResult.statusCode).toBe(400);
      expect(failedResult.message).toContain('transaction');

      // Verify standalone income was deleted
      await request(server)
        .get(`/accounting/income/${standaloneIncomeId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);

      // Verify income with transaction still exists
      await request(server)
        .get(`/accounting/income/${incomeWithTransactionId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);
    });
  });
});
