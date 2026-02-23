import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
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
import { TransactionStatus, TransactionType } from '@asset-backend/common/types';
import * as http from 'http';
import { ExpenseInputDto } from '@asset-backend/accounting/expense/dtos/expense-input.dto';
import { TransactionInputDto } from '@asset-backend/accounting/transaction/dtos/transaction-input.dto';
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

    it('returns 400 when accountingDate is invalid', async () => {
      const input = {
        ...getValidExpenseInput(mainUser.properties[0].id),
        accountingDate: 'Invalid Date',
      };

      const response = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send(input)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('accountingDate')]),
      );
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
    it('deletes standalone expense when user owns it', async () => {
      // Create standalone expense (without transaction)
      const createResponse = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          expenseTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone expense to delete',
          amount: 25,
          quantity: 1,
          totalAmount: 25,
        })
        .expect(201);

      const expenseIdToDelete = createResponse.body.id;

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

    it('returns 400 when expense has a transaction relation', async () => {
      // Create expense with transaction via HTTP
      const createResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Expense Delete Prevention Test',
          receiver: 'Test Receiver',
          description: 'Transaction with expense to test delete prevention',
          transactionDate: new Date('2024-03-01'),
          accountingDate: new Date('2024-03-01'),
          amount: -100,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `delete-prevention-${Date.now()}`,
          expenses: [
            {
              expenseTypeId: 1,
              description: 'Expense with transaction',
              amount: 100,
              quantity: 1,
              totalAmount: 100,
            },
          ],
        })
        .expect(201);

      // Get the expense ID from the transaction
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: createResponse.body.id },
          relations: { expenses: true },
        })
        .expect(200);

      const expenseId = searchResponse.body[0].expenses[0].id;

      // Try to delete the expense - should be rejected
      const deleteResponse = await request(server)
        .delete(`${baseUrl}/${expenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(400);

      expect(deleteResponse.body.message).toContain('transaction');
    });
  });

  describe('POST /accounting/expense/delete (bulk delete)', () => {
    it('deletes multiple standalone expenses when user owns them', async () => {
      // Create standalone expenses (without transactions)
      const expense1Response = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          expenseTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone expense 1 for bulk delete',
          amount: 30,
          quantity: 1,
          totalAmount: 30,
        })
        .expect(201);

      const expense2Response = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          expenseTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone expense 2 for bulk delete',
          amount: 40,
          quantity: 1,
          totalAmount: 40,
        })
        .expect(201);

      const ids = [expense1Response.body.id, expense2Response.body.id];

      const response = await request(server)
        .post(`${baseUrl}/delete`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids })
        .expect(201);

      expect(response.body.allSuccess).toBe(true);
      expect(response.body.rows.total).toBe(2);
      expect(response.body.rows.success).toBe(2);
      expect(response.body.rows.failed).toBe(0);

      // Verify expenses are deleted
      await request(server)
        .get(`${baseUrl}/${ids[0]}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
      await request(server)
        .get(`${baseUrl}/${ids[1]}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });

    it('returns 401 when not authenticated', () => {
      return request(server)
        .post(`${baseUrl}/delete`)
        .send({ ids: [1, 2] })
        .expect(401);
    });

    it('returns 400 when ids array is empty', async () => {
      return request(server)
        .post(`${baseUrl}/delete`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [] })
        .expect(400);
    });

    it('returns partial success when some expenses belong to other user', async () => {
      // Create standalone expense for main user
      const mainUserExpenseResponse = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          expenseTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Main user standalone expense for partial success test',
          amount: 60,
          quantity: 1,
          totalAmount: 60,
        })
        .expect(201);

      // Create standalone expense for user2
      const user2 = testUsers.user2WithProperties;
      const user2Token = await getUserAccessToken2(authService, user2.jwtUser);
      const user2ExpenseResponse = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(user2Token))
        .send({
          expenseTypeId: 1,
          propertyId: user2.properties[0].id,
          description: 'User2 standalone expense for partial success test',
          amount: 70,
          quantity: 1,
          totalAmount: 70,
        })
        .expect(201);

      const ids = [mainUserExpenseResponse.body.id, user2ExpenseResponse.body.id];

      const response = await request(server)
        .post(`${baseUrl}/delete`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids })
        .expect(201);

      expect(response.body.allSuccess).toBe(false);
      expect(response.body.rows.success).toBe(1);
      expect(response.body.rows.failed).toBe(1);
    });

    it('returns 400 for expenses with transaction relation and deletes only standalone expenses', async () => {
      // Create a standalone expense (without transaction)
      const standaloneExpenseResponse = await request(server)
        .post(baseUrl)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          expenseTypeId: 1,
          propertyId: mainUser.properties[0].id,
          description: 'Standalone expense for bulk delete test',
          amount: 50,
          quantity: 1,
          totalAmount: 50,
        })
        .expect(201);

      const standaloneExpenseId = standaloneExpenseResponse.body.id;

      // Create an expense with transaction
      const transactionResponse = await request(server)
        .post('/accounting/transaction')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          sender: 'Bulk Delete Prevention Test',
          receiver: 'Test Receiver',
          description: 'Transaction with expense for bulk delete prevention',
          transactionDate: new Date('2024-03-02'),
          accountingDate: new Date('2024-03-02'),
          amount: -75,
          propertyId: mainUser.properties[0].id,
          status: TransactionStatus.ACCEPTED,
          type: TransactionType.EXPENSE,
          externalId: `bulk-delete-prevention-${Date.now()}`,
          expenses: [
            {
              expenseTypeId: 1,
              description: 'Expense with transaction for bulk delete',
              amount: 75,
              quantity: 1,
              totalAmount: 75,
            },
          ],
        })
        .expect(201);

      // Get the expense ID from the transaction
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          where: { id: transactionResponse.body.id },
          relations: { expenses: true },
        })
        .expect(200);

      const expenseWithTransactionId = searchResponse.body[0].expenses[0].id;

      // Try to bulk delete both - should succeed for standalone, fail for expense with transaction
      const deleteResponse = await request(server)
        .post(`${baseUrl}/delete`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({ ids: [standaloneExpenseId, expenseWithTransactionId] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.rows.success).toBe(1);
      expect(deleteResponse.body.rows.failed).toBe(1);

      // The failed one should have 400 status code
      const failedResult = deleteResponse.body.results.find(
        (r: { id: number; statusCode: number }) => r.id === expenseWithTransactionId,
      );
      expect(failedResult.statusCode).toBe(400);
      expect(failedResult.message).toContain('transaction');

      // Verify standalone expense was deleted
      await request(server)
        .get(`${baseUrl}/${standaloneExpenseId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);

      // Verify expense with transaction still exists
      await request(server)
        .get(`${baseUrl}/${expenseWithTransactionId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);
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
