import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  closeAppGracefully,
  emptyTables,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import { DataSource } from 'typeorm';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { User } from '@alisa-backend/people/user/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let dataSource: DataSource;
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
    dataSource = app.get(DataSource);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('GET /auth/user', () => {
    it('returns current user info when authenticated', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(user.user.id);
      expect(response.body.firstName).toBe(user.jwtUser.firstName);
      expect(response.body.lastName).toBe(user.jwtUser.lastName);
      expect(response.body.email).toBe(user.jwtUser.email);
    });

    it('returns user for user with properties', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(user.user.id);
      expect(response.body.firstName).toBe(user.jwtUser.firstName);
      expect(response.body.email).toBe(user.jwtUser.email);
    });

    it('returns user for user without properties', async () => {
      const user = testUsers.userWithoutProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(user.user.id);
      expect(response.body.firstName).toBe(user.jwtUser.firstName);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server).get('/auth/user').expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(server)
        .get('/auth/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PUT /auth/user/settings', () => {
    it('updates user dashboard config', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const settingsInput = {
        dashboardConfig: {
          widgets: [
            { id: 'widget1', visible: true, order: 1, size: '1/2' },
            { id: 'widget2', visible: false, order: 2, size: '1/4' },
          ],
        },
      };

      const response = await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send(settingsInput)
        .expect(200);

      expect(response.body.dashboardConfig).toBeDefined();
      expect(response.body.dashboardConfig.widgets).toHaveLength(2);
      expect(response.body.dashboardConfig.widgets[0].id).toBe('widget1');
      expect(response.body.dashboardConfig.widgets[0].visible).toBe(true);
    });

    it('updates user language', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.language).toBe('en');
    });

    it('rejects invalid language value', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send({ language: 'invalid' })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .put('/auth/user/settings')
        .send({ language: 'en' })
        .expect(401);
    });

    it('preserves user identity after settings update', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const settingsInput = {
        language: 'fi',
      };

      const response = await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send(settingsInput)
        .expect(200);

      expect(response.body.id).toBe(user.user.id);
      expect(response.body.firstName).toBe(user.jwtUser.firstName);
      expect(response.body.lastName).toBe(user.jwtUser.lastName);
      expect(response.body.email).toBe(user.jwtUser.email);
    });
  });

  describe('User isolation', () => {
    it('each user only sees their own data', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const response1 = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token1))
        .expect(200);

      const response2 = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token2))
        .expect(200);

      expect(response1.body.id).not.toBe(response2.body.id);
      expect(response1.body.email).toBe(user1.jwtUser.email);
      expect(response2.body.email).toBe(user2.jwtUser.email);
    });

    it('user1 settings update does not affect user2', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Update user1's language
      await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token1))
        .send({ language: 'sv' })
        .expect(200);

      // User2's language should not be affected
      const response2 = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token2))
        .expect(200);

      expect(response2.body.language).not.toBe('sv');
    });
  });

  describe('OAuth endpoints', () => {
    describe('GET /auth/logout', () => {
      it('redirects when accessed without authentication', async () => {
        // Logout endpoint redirects regardless of auth status
        await request(server).get('/auth/logout').expect(302);
      });
    });

    describe('GET /google/authenticate', () => {
      // OAuth endpoints require external Google authentication flow
      // which cannot be fully tested in e2e tests
      it.skip('returns authentication url', async () => {
        await request(server).get('/google/authenticate').expect(200);
      });
    });
  });

  describe('Global types', () => {
    it('global expense types are seeded and available', async () => {
      const expenseTypeRepo = dataSource.getRepository(ExpenseType);
      const expenseTypes = await expenseTypeRepo.find();

      // Should have 15 global expense types seeded by DefaultsSeeder
      expect(expenseTypes.length).toBe(15);

      // Verify some expected keys exist
      const keys = expenseTypes.map((t) => t.key);
      expect(keys).toContain('loan-interest');
      expect(keys).toContain('loan-principal');
      expect(keys).toContain('loan-handling-fee');
      expect(keys).toContain('housing-charge');
    });

    it('global income types are seeded and available', async () => {
      const incomeTypeRepo = dataSource.getRepository(IncomeType);
      const incomeTypes = await incomeTypeRepo.find();

      // Should have 4 global income types seeded by DefaultsSeeder
      expect(incomeTypes.length).toBe(4);

      // Verify some expected keys exist
      const keys = incomeTypes.map((t) => t.key);
      expect(keys).toContain('rental');
      expect(keys).toContain('airbnb');
      expect(keys).toContain('capital-income');
      expect(keys).toContain('insurance-compensation');
    });
  });

  describe('Language persistence on re-login', () => {
    beforeEach(async () => {
      await emptyTables(dataSource, [
        'expense',
        'income',
        'transaction',
        'ownership',
        'user',
        'property',
        'property_statistics',
      ]);
    });

    it('preserves user language preference on subsequent logins', async () => {
      // First login - user gets Finnish from Google profile
      await authService.login({
        firstName: 'Test',
        lastName: 'User',
        email: 'langtest@test.com',
        language: 'fi',
      });

      // User changes language to English via settings
      const userRepo = dataSource.getRepository(User);
      let user = await userRepo.findOne({
        where: { email: 'langtest@test.com' },
      });
      await authService.updateUserSettings(user.id, { language: 'en' });

      // Verify language was changed
      user = await userRepo.findOne({
        where: { email: 'langtest@test.com' },
      });
      expect(user.language).toBe('en');

      // Second login - Google sends Finnish again
      await authService.login({
        firstName: 'Test',
        lastName: 'User',
        email: 'langtest@test.com',
        language: 'fi',
      });

      // Language should still be English (user preference preserved)
      user = await userRepo.findOne({
        where: { email: 'langtest@test.com' },
      });
      expect(user.language).toBe('en');
    });

    it('sets language on first login from Google profile', async () => {
      await authService.login({
        firstName: 'New',
        lastName: 'User',
        email: 'newlang@test.com',
        language: 'en',
      });

      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email: 'newlang@test.com' },
      });

      expect(user.language).toBe('en');
    });
  });
});
