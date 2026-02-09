import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';

describe('IncomeTypeController (e2e)', () => {
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
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /accounting/income/type/search', () => {
    it('returns empty array when no income types exist', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(token))
        .send({})
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/income/type/search')
        .send({})
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });
  });

  describe('POST /accounting/income/type', () => {
    it('creates a new income type', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'Rent Income',
        description: 'Monthly rent payments',
        isTaxable: true,
      };

      const response = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token))
        .send(incomeTypeInput)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Rent Income');
      expect(response.body.description).toBe('Monthly rent payments');
      expect(response.body.isTaxable).toBe(true);
      expect(response.body.userId).toBe(user.user.id);
    });

    it('creates income type with default isTaxable as false', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'Other Income',
        description: 'Miscellaneous income',
      };

      const response = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token))
        .send(incomeTypeInput)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Other Income');
      expect(response.body.isTaxable).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'Test Income',
        description: 'Test description',
      };

      await request(server)
        .post('/accounting/income/type')
        .send(incomeTypeInput)
        .expect(401);
    });
  });

  describe('GET /accounting/income/type/:id', () => {
    let createdIncomeTypeId: number;

    beforeAll(async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'Deposit Interest',
        description: 'Interest from security deposits',
        isTaxable: true,
      };

      const response = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token))
        .send(incomeTypeInput);

      createdIncomeTypeId = response.body.id;
    });

    it('returns a single income type by id', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get(`/accounting/income/type/${createdIncomeTypeId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(createdIncomeTypeId);
      expect(response.body.name).toBe('Deposit Interest');
      expect(response.body.description).toBe('Interest from security deposits');
      expect(response.body.isTaxable).toBe(true);
    });

    it('returns 404 for non-existent income type', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .get('/accounting/income/type/999999')
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .get(`/accounting/income/type/${createdIncomeTypeId}`)
        .expect(401);
    });
  });

  describe('PUT /accounting/income/type/:id', () => {
    let incomeTypeToUpdateId: number;

    beforeAll(async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'Original Name',
        description: 'Original description',
        isTaxable: false,
      };

      const response = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token))
        .send(incomeTypeInput);

      incomeTypeToUpdateId = response.body.id;
    });

    it('updates an existing income type', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const updatedInput: IncomeTypeInputDto = {
        name: 'Updated Name',
        description: 'Updated description',
        isTaxable: true,
      };

      const response = await request(server)
        .put(`/accounting/income/type/${incomeTypeToUpdateId}`)
        .set('Authorization', getBearerToken(token))
        .send(updatedInput)
        .expect(200);

      expect(response.body.id).toBe(incomeTypeToUpdateId);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.isTaxable).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const updatedInput: IncomeTypeInputDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      await request(server)
        .put(`/accounting/income/type/${incomeTypeToUpdateId}`)
        .send(updatedInput)
        .expect(401);
    });
  });

  describe('DELETE /accounting/income/type/:id', () => {
    let incomeTypeToDeleteId: number;

    beforeAll(async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const incomeTypeInput: IncomeTypeInputDto = {
        name: 'To Be Deleted',
        description: 'This will be deleted',
        isTaxable: false,
      };

      const response = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token))
        .send(incomeTypeInput);

      incomeTypeToDeleteId = response.body.id;
    });

    it('deletes an existing income type', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .delete(`/accounting/income/type/${incomeTypeToDeleteId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.status).toBe(200);

      // Verify it's deleted
      await request(server)
        .get(`/accounting/income/type/${incomeTypeToDeleteId}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .delete('/accounting/income/type/1')
        .expect(401);
    });
  });

  describe('User isolation', () => {
    let user1IncomeTypeId: number;
    let user2IncomeTypeId: number;

    beforeAll(async () => {
      // Create income type for user1
      const user1 = testUsers.user1WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user1IncomeType: IncomeTypeInputDto = {
        name: 'User1 Income Type',
        description: 'Belongs to user1',
        isTaxable: true,
      };

      const response1 = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token1))
        .send(user1IncomeType);

      user1IncomeTypeId = response1.body.id;

      // Create income type for user2
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const user2IncomeType: IncomeTypeInputDto = {
        name: 'User2 Income Type',
        description: 'Belongs to user2',
        isTaxable: false,
      };

      const response2 = await request(server)
        .post('/accounting/income/type')
        .set('Authorization', getBearerToken(token2))
        .send(user2IncomeType);

      user2IncomeTypeId = response2.body.id;
    });

    it('user1 cannot see user2 income types in search', async () => {
      const user1 = testUsers.user1WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const response = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(token1))
        .send({})
        .expect(200);

      const incomeTypeIds = response.body.map(
        (incomeType: { id: number }) => incomeType.id,
      );
      expect(incomeTypeIds).not.toContain(user2IncomeTypeId);
    });

    it('user2 cannot see user1 income types in search', async () => {
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const response = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(token2))
        .send({})
        .expect(200);

      const incomeTypeIds = response.body.map(
        (incomeType: { id: number }) => incomeType.id,
      );
      expect(incomeTypeIds).not.toContain(user1IncomeTypeId);
    });

    it('user1 cannot access user2 income type by id', async () => {
      const user1 = testUsers.user1WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      await request(server)
        .get(`/accounting/income/type/${user2IncomeTypeId}`)
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });

    it('user2 cannot access user1 income type by id', async () => {
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      await request(server)
        .get(`/accounting/income/type/${user1IncomeTypeId}`)
        .set('Authorization', getBearerToken(token2))
        .expect(401);
    });

    it('user1 cannot update user2 income type', async () => {
      const user1 = testUsers.user1WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const updatedInput: IncomeTypeInputDto = {
        name: 'Hacked Name',
        description: 'Hacked description',
      };

      await request(server)
        .put(`/accounting/income/type/${user2IncomeTypeId}`)
        .set('Authorization', getBearerToken(token1))
        .send(updatedInput)
        .expect(401);
    });

    it('user2 cannot update user1 income type', async () => {
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const updatedInput: IncomeTypeInputDto = {
        name: 'Hacked Name',
        description: 'Hacked description',
      };

      await request(server)
        .put(`/accounting/income/type/${user1IncomeTypeId}`)
        .set('Authorization', getBearerToken(token2))
        .send(updatedInput)
        .expect(401);
    });

    it('user1 cannot delete user2 income type', async () => {
      const user1 = testUsers.user1WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      await request(server)
        .delete(`/accounting/income/type/${user2IncomeTypeId}`)
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });

    it('user2 cannot delete user1 income type', async () => {
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      await request(server)
        .delete(`/accounting/income/type/${user1IncomeTypeId}`)
        .set('Authorization', getBearerToken(token2))
        .expect(401);
    });

    it('each user only sees their own income types', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const response1 = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(token1))
        .send({})
        .expect(200);

      const response2 = await request(server)
        .post('/accounting/income/type/search')
        .set('Authorization', getBearerToken(token2))
        .send({})
        .expect(200);

      // Verify user1's income types all belong to user1
      response1.body.forEach((incomeType: { userId: number }) => {
        expect(incomeType.userId).toBe(user1.user.id);
      });

      // Verify user2's income types all belong to user2
      response2.body.forEach((incomeType: { userId: number }) => {
        expect(incomeType.userId).toBe(user2.user.id);
      });
    });
  });
});
