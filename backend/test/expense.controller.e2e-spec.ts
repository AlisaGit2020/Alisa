import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addIncomeAndExpenseTypes,
  addTransaction,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import {
  getTransactionExpense1,
  getTransactionExpense2,
} from './data/mocks/transaction.mock';
import { TransactionStatus } from '@alisa-backend/common/types';
import * as http from 'http';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { startOfDay } from 'date-fns';

describe('ExpenseController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let mainUserToken: string;
  let noDataUserToken: string;

  const baseUrl = '/accounting/expense';

  const getValidExpenseInput = (propertyId: number): ExpenseInputDto => ({
    expenseTypeId: 1,
    propertyId: propertyId,
    description: 'Siivousmaksu',
    amount: 39.64,
    quantity: 1,
    totalAmount: 39.64,
    transaction: {
      status: TransactionStatus.ACCEPTED,
      externalId: `test-${Date.now()}`,
      sender: 'Aurora',
      receiver: 'Bolag asuntoyhtiö Oy',
      description: 'Siivousmaksu',
      transactionDate: startOfDay(new Date('2023-01-31')),
      accountingDate: startOfDay(new Date('2023-02-28')),
      amount: -39.64,
    } as TransactionInputDto,
  });

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

    // Add expense and income types for test users
    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
    await addIncomeAndExpenseTypes(testUsers.user2WithProperties.jwtUser, app);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('Authorization (401 Unauthorized)', () => {
    it(`GET ${baseUrl}/:id - fails when not authenticated`, () => {
      return request(server).get(`${baseUrl}/1`).expect(401);
    });

    it(`PUT ${baseUrl}/:id - fails when not authenticated`, () => {
      return request(server).put(`${baseUrl}/1`).expect(401);
    });

    it(`DELETE ${baseUrl}/:id - fails when not authenticated`, () => {
      return request(server).delete(`${baseUrl}/1`).expect(401);
    });

    it(`POST ${baseUrl}/search - fails when not authenticated`, () => {
      return request(server).post(`${baseUrl}/search`).expect(401);
    });

    it(`POST ${baseUrl} - fails when not authenticated`, () => {
      return request(server).post(baseUrl).expect(401);
    });
  });

  describe('User isolation (no access to other user data)', () => {
    let user2ExpenseId: number;

    beforeAll(async () => {
      // Create expense for user2
      const user2 = testUsers.user2WithProperties;
      const transaction = await addTransaction(
        app,
        user2.jwtUser,
        getTransactionExpense1(user2.properties[0].id, TransactionStatus.ACCEPTED),
      );
      user2ExpenseId = transaction.expenses[0].id;
    });

    it(`GET ${baseUrl}/:id - fails when accessing other user's expense`, async () => {
      return request(server)
        .get(`${baseUrl}/${user2ExpenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(401);
    });

    it(`DELETE ${baseUrl}/:id - fails when deleting other user's expense`, async () => {
      return request(server)
        .delete(`${baseUrl}/${user2ExpenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(401);
    });

    it(`PUT ${baseUrl}/:id - fails when updating other user's expense`, async () => {
      const updateInput = getValidExpenseInput(mainUser.properties[0].id);
      return request(server)
        .put(`${baseUrl}/${user2ExpenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(updateInput)
        .expect(401);
    });

    it(`POST ${baseUrl}/search - returns no items for user without data`, async () => {
      const response = await request(server)
        .post(`${baseUrl}/search`)
        .set('Authorization', getBearerToken(noDataUserToken))
        .send({})
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /accounting/expense/search', () => {
    beforeAll(async () => {
      // Add some expenses for main user
      await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
      );
      await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense2(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
      );
    });

    it('searches expenses successfully', async () => {
      const response = await request(server)
        .post(`${baseUrl}/search`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ where: { propertyId: mainUser.properties[0].id } })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('filters expenses by property', async () => {
      const propertyId = mainUser.properties[0].id;
      const response = await request(server)
        .post(`${baseUrl}/search`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ where: { propertyId } })
        .expect(200);

      response.body.forEach((expense: { propertyId: number }) => {
        expect(expense.propertyId).toBe(propertyId);
      });
    });

    it('excludes expenses with pending transaction from search results', async () => {
      const propertyId = mainUser.properties[1].id;

      // Create expense with ACCEPTED transaction
      await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(propertyId, TransactionStatus.ACCEPTED),
      );

      // Create expense with PENDING transaction
      await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense2(propertyId, TransactionStatus.PENDING),
      );

      const response = await request(server)
        .post(`${baseUrl}/search`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ where: { propertyId } })
        .expect(200);

      // All returned expenses should have ACCEPTED transaction status
      response.body.forEach((expense: { transaction: { status: TransactionStatus } }) => {
        expect(expense.transaction.status).toBe(TransactionStatus.ACCEPTED);
      });
    });
  });

  describe('GET /accounting/expense/default', () => {
    it('returns default expense values', async () => {
      const response = await request(server)
        .get(`${baseUrl}/default`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.expenseTypeId).toBeDefined();
    });
  });

  describe('GET /accounting/expense/:id', () => {
    let expenseId: number;

    beforeAll(async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
      );
      expenseId = transaction.expenses[0].id;
    });

    it('returns expense when user owns it', async () => {
      const response = await request(server)
        .get(`${baseUrl}/${expenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body.id).toBe(expenseId);
      expect(response.body.propertyId).toBe(mainUser.properties[0].id);
    });

    it('returns 404 when expense does not exist', async () => {
      return request(server)
        .get(`${baseUrl}/99999`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 404 when getting expense with pending transaction by id', async () => {
      // Create expense with PENDING transaction
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.PENDING),
      );
      const pendingExpenseId = transaction.expenses[0].id;

      return request(server)
        .get(`${baseUrl}/${pendingExpenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });
  });

  describe('POST /accounting/expense', () => {
    it('creates a new expense', async () => {
      const input = getValidExpenseInput(mainUser.properties[0].id);

      const response = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(input)
        .expect(201);

      expect(response.body.id).toBeGreaterThan(0);
      expect(response.body.description).toBe(input.description);
      expect(response.body.amount).toBe(input.amount);
      expect(response.body.propertyId).toBe(input.propertyId);
    });

    it('fails when trying to create expense for property user does not own', async () => {
      const otherUserPropertyId = testUsers.user2WithProperties.properties[0].id;
      const input = getValidExpenseInput(otherUserPropertyId);

      return request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(input)
        .expect(401);
    });
  });

  describe('PUT /accounting/expense/:id', () => {
    let expenseId: number;

    beforeAll(async () => {
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
      );
      expenseId = transaction.expenses[0].id;
    });

    it('updates expense when user owns it', async () => {
      const updateInput = {
        description: 'Updated description',
        amount: 99.99,
        quantity: 2,
        totalAmount: 199.98,
        expenseTypeId: 1,
        propertyId: mainUser.properties[0].id,
      };

      const response = await request(server)
        .put(`${baseUrl}/${expenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(updateInput)
        .expect(200);

      expect(response.body.description).toBe(updateInput.description);
      expect(response.body.amount).toBe(updateInput.amount);
    });

    it('returns 404 when expense does not exist', async () => {
      const updateInput = getValidExpenseInput(mainUser.properties[0].id);

      return request(server)
        .put(`${baseUrl}/99999`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(updateInput)
        .expect(404);
    });
  });

  describe('DELETE /accounting/expense/:id', () => {
    it('deletes expense when user owns it', async () => {
      // Create expense to delete
      const transaction = await addTransaction(
        app,
        mainUser.jwtUser,
        getTransactionExpense1(mainUser.properties[0].id, TransactionStatus.ACCEPTED),
      );
      const expenseIdToDelete = transaction.expenses[0].id;

      await request(server)
        .delete(`${baseUrl}/${expenseIdToDelete}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200)
        .expect('true');

      // Verify expense is deleted
      await request(server)
        .get(`${baseUrl}/${expenseIdToDelete}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 404 when expense does not exist', async () => {
      return request(server)
        .delete(`${baseUrl}/99999`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });
  });

  describe('Transaction status handling', () => {
    it('returns expense when its transaction is accepted', async () => {
      const user = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[1].id;

      // Create expense with ACCEPTED transaction
      const transaction = await addTransaction(
        app,
        user.jwtUser,
        getTransactionExpense1(propertyId, TransactionStatus.ACCEPTED),
      );
      const expenseId = transaction.expenses[0].id;

      const response = await request(server)
        .get(`${baseUrl}/${expenseId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(expenseId);
      expect(response.body.transaction.status).toBe(TransactionStatus.ACCEPTED);
    });
  });
});
