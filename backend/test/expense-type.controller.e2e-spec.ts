import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { getTransactionExpense1 } from './data/mocks/transaction.mock';

describe('ExpenseTypeController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;

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
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  let expenseTypeCounter = 0;

  const createExpenseType = (
    baseName: string,
    isTaxDeductible = false,
    isCapitalImprovement = false,
  ): ExpenseTypeInputDto => {
    expenseTypeCounter++;
    const name = `${baseName} ${expenseTypeCounter}`;
    return {
      name,
      description: `Description for ${name}`,
      isTaxDeductible,
      isCapitalImprovement,
    };
  };

  describe('POST /accounting/expense/type (create)', () => {
    it('creates a new expense type when authenticated', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const expenseTypeInput = createExpenseType('Test Expense', true, false);

      const response = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(token))
        .send(expenseTypeInput)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toMatch(/^Test Expense \d+$/);
      expect(response.body.description).toMatch(/^Description for Test Expense \d+$/);
      expect(response.body.isTaxDeductible).toBe(true);
      expect(response.body.isCapitalImprovement).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      const expenseTypeInput = createExpenseType('Unauthenticated Expense');

      await request(server)
        .post('/accounting/expense/type')
        .send(expenseTypeInput)
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      const expenseTypeInput = createExpenseType('Invalid Token Expense');

      await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', 'Bearer invalid-token')
        .send(expenseTypeInput)
        .expect(401);
    });
  });

  describe('POST /accounting/expense/type/search', () => {
    let user1Token: string;
    let user2Token: string;

    beforeAll(async () => {
      user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );
      user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      // Create expense types for user1
      await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('User1 Expense Type 1', true))
        .expect(201);

      await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('User1 Expense Type 2', false))
        .expect(201);

      // Create expense types for user2
      await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user2Token))
        .send(createExpenseType('User2 Expense Type 1', true))
        .expect(201);
    });

    it('returns expense types for authenticated user', async () => {
      const response = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(user1Token))
        .send({})
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/expense/type/search')
        .send({})
        .expect(401);
    });

    it('user1 does not see user2 expense types', async () => {
      const response = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(user1Token))
        .send({})
        .expect(200);

      const user2ExpenseType = response.body.find(
        (et: { name: string }) => et.name === 'User2 Expense Type 1',
      );
      expect(user2ExpenseType).toBeUndefined();
    });

    it('user2 does not see user1 expense types', async () => {
      const response = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(user2Token))
        .send({})
        .expect(200);

      const user1ExpenseTypes = response.body.filter((et: { name: string }) =>
        et.name.startsWith('User1'),
      );
      expect(user1ExpenseTypes.length).toBe(0);
    });
  });

  describe('GET /accounting/expense/type/:id', () => {
    let createdExpenseTypeId: number;
    let user1Token: string;

    beforeAll(async () => {
      user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );

      // Create an expense type for user1
      const response = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('Get Test Expense', true, true))
        .expect(201);

      createdExpenseTypeId = response.body.id;
    });

    it('returns expense type by id for owner', async () => {
      const response = await request(server)
        .get(`/accounting/expense/type/${createdExpenseTypeId}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      expect(response.body.id).toBe(createdExpenseTypeId);
      expect(response.body.name).toMatch(/^Get Test Expense \d+$/);
      expect(response.body.isTaxDeductible).toBe(true);
      expect(response.body.isCapitalImprovement).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get(`/accounting/expense/type/${createdExpenseTypeId}`)
        .expect(401);
    });

    it('returns 404 for non-existent expense type', async () => {
      await request(server)
        .get('/accounting/expense/type/999999')
        .set('Authorization', getBearerToken(user1Token))
        .expect(404);
    });

    it('user2 cannot access user1 expense type', async () => {
      const user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      await request(server)
        .get(`/accounting/expense/type/${createdExpenseTypeId}`)
        .set('Authorization', getBearerToken(user2Token))
        .expect(401);
    });
  });

  describe('PUT /accounting/expense/type/:id', () => {
    let createdExpenseTypeId: number;
    let user1Token: string;

    beforeAll(async () => {
      user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );

      // Create an expense type for user1
      const response = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('Update Test Expense', false, false))
        .expect(201);

      createdExpenseTypeId = response.body.id;
    });

    it('updates expense type for owner', async () => {
      const updateInput: ExpenseTypeInputDto = {
        name: 'Updated Expense Name',
        description: 'Updated description',
        isTaxDeductible: true,
        isCapitalImprovement: true,
      };

      const response = await request(server)
        .put(`/accounting/expense/type/${createdExpenseTypeId}`)
        .set('Authorization', getBearerToken(user1Token))
        .send(updateInput)
        .expect(200);

      expect(response.body.id).toBe(createdExpenseTypeId);
      expect(response.body.name).toBe('Updated Expense Name');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.isTaxDeductible).toBe(true);
      expect(response.body.isCapitalImprovement).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const updateInput: ExpenseTypeInputDto = {
        name: 'Unauthorized Update',
        description: '',
        isTaxDeductible: false,
        isCapitalImprovement: false,
      };

      await request(server)
        .put(`/accounting/expense/type/${createdExpenseTypeId}`)
        .send(updateInput)
        .expect(401);
    });

    it('user2 cannot update user1 expense type', async () => {
      const user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      const updateInput: ExpenseTypeInputDto = {
        name: 'Hacked by User2',
        description: '',
        isTaxDeductible: false,
        isCapitalImprovement: false,
      };

      await request(server)
        .put(`/accounting/expense/type/${createdExpenseTypeId}`)
        .set('Authorization', getBearerToken(user2Token))
        .send(updateInput)
        .expect(401);
    });
  });

  describe('DELETE /accounting/expense/type/:id', () => {
    let user1Token: string;

    beforeAll(async () => {
      user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );
    });

    it('deletes expense type for owner', async () => {
      // Create an expense type to delete
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('To Be Deleted'))
        .expect(201);

      const expenseTypeId = createResponse.body.id;

      // Delete it
      await request(server)
        .delete(`/accounting/expense/type/${expenseTypeId}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      // Verify it's deleted
      await request(server)
        .get(`/accounting/expense/type/${expenseTypeId}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      // Create an expense type first
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('Delete Without Auth'))
        .expect(201);

      await request(server)
        .delete(`/accounting/expense/type/${createResponse.body.id}`)
        .expect(401);
    });

    it('user2 cannot delete user1 expense type', async () => {
      const user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      // Create an expense type for user1
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('User1 Protected Expense'))
        .expect(201);

      const expenseTypeId = createResponse.body.id;

      // User2 tries to delete it
      await request(server)
        .delete(`/accounting/expense/type/${expenseTypeId}`)
        .set('Authorization', getBearerToken(user2Token))
        .expect(401);

      // Verify it still exists for user1
      await request(server)
        .get(`/accounting/expense/type/${expenseTypeId}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);
    });
  });

  describe('User isolation', () => {
    it('expense types are completely isolated between users', async () => {
      const user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );
      const user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      // User1 creates an expense type
      const user1CreateResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('Isolation Test User1'))
        .expect(201);

      // User2 creates an expense type
      const user2CreateResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user2Token))
        .send(createExpenseType('Isolation Test User2'))
        .expect(201);

      // User1 searches and should only see their own
      const user1SearchResponse = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(user1Token))
        .send({})
        .expect(200);

      const user1SeeingUser2 = user1SearchResponse.body.find(
        (et: { id: number }) => et.id === user2CreateResponse.body.id,
      );
      expect(user1SeeingUser2).toBeUndefined();

      // User2 searches and should only see their own
      const user2SearchResponse = await request(server)
        .post('/accounting/expense/type/search')
        .set('Authorization', getBearerToken(user2Token))
        .send({})
        .expect(200);

      const user2SeeingUser1 = user2SearchResponse.body.find(
        (et: { id: number }) => et.id === user1CreateResponse.body.id,
      );
      expect(user2SeeingUser1).toBeUndefined();

      // User1 can access their own by id
      await request(server)
        .get(`/accounting/expense/type/${user1CreateResponse.body.id}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      // User1 cannot access user2's by id
      await request(server)
        .get(`/accounting/expense/type/${user2CreateResponse.body.id}`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(401);
    });
  });

  describe('GET /accounting/expense/type/:id/can-delete', () => {
    let user1Token: string;
    const createdTypeIds: number[] = [];

    beforeAll(async () => {
      user1Token = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );

      // Add income and expense types for user1
      await addIncomeAndExpenseTypes(testUsers.user1WithProperties.jwtUser, app);
    });

    afterAll(async () => {
      // Clean up created expense types
      for (const id of createdTypeIds) {
        try {
          await request(server)
            .delete(`/accounting/expense/type/${id}`)
            .set('Authorization', getBearerToken(user1Token));
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('returns canDelete true with no dependencies when expense type has no expenses', async () => {
      // Create an expense type without any expenses
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('No Dependencies Type'))
        .expect(201);

      createdTypeIds.push(createResponse.body.id);

      const response = await request(server)
        .get(`/accounting/expense/type/${createResponse.body.id}/can-delete`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      expect(response.body.canDelete).toBe(true);
      expect(response.body.dependencies).toEqual([]);
      expect(response.body.message).toBeUndefined();
    });

    it('returns dependencies when expense type has linked expenses', async () => {
      // Create an expense type with a linked expense
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('Type With Dependencies'))
        .expect(201);

      createdTypeIds.push(createResponse.body.id);

      const propertyId = testUsers.user1WithProperties.properties[0].id;
      const transaction = getTransactionExpense1(propertyId);
      transaction.expenses[0].expenseTypeId = createResponse.body.id;

      await addTransaction(
        app,
        testUsers.user1WithProperties.jwtUser,
        transaction,
      );

      const response = await request(server)
        .get(`/accounting/expense/type/${createResponse.body.id}/can-delete`)
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      expect(response.body.canDelete).toBe(true);
      expect(response.body.dependencies).toHaveLength(1);
      expect(response.body.dependencies[0].type).toBe('expense');
      expect(response.body.dependencies[0].count).toBeGreaterThanOrEqual(1);
      expect(response.body.dependencies[0].samples.length).toBeGreaterThanOrEqual(1);
      expect(response.body.message).toBe(
        'The following related data will be deleted',
      );
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get('/accounting/expense/type/1/can-delete')
        .expect(401);
    });

    it('returns 404 for non-existent expense type', async () => {
      await request(server)
        .get('/accounting/expense/type/999999/can-delete')
        .set('Authorization', getBearerToken(user1Token))
        .expect(404);
    });

    it('returns 401 when trying to check another users expense type', async () => {
      const user2Token = await getUserAccessToken2(
        authService,
        testUsers.user2WithProperties.jwtUser,
      );

      // Create expense type for user1
      const createResponse = await request(server)
        .post('/accounting/expense/type')
        .set('Authorization', getBearerToken(user1Token))
        .send(createExpenseType('User1 Private Type'))
        .expect(201);

      createdTypeIds.push(createResponse.body.id);

      // User2 tries to check it
      await request(server)
        .get(`/accounting/expense/type/${createResponse.body.id}/can-delete`)
        .set('Authorization', getBearerToken(user2Token))
        .expect(401);
    });
  });
});
