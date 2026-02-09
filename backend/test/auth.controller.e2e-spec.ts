import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
import { ExpenseTypeDefault } from '@alisa-backend/defaults/entities/expense-type-default.entity';
import { IncomeTypeDefault } from '@alisa-backend/defaults/entities/income-type-default.entity';
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
    it('updates user loan expense type settings', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const settingsInput = {
        loanPrincipalExpenseTypeId: 1,
        loanInterestExpenseTypeId: 2,
        loanHandlingFeeExpenseTypeId: 3,
      };

      const response = await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send(settingsInput)
        .expect(200);

      expect(response.body.loanPrincipalExpenseTypeId).toBe(1);
      expect(response.body.loanInterestExpenseTypeId).toBe(2);
      expect(response.body.loanHandlingFeeExpenseTypeId).toBe(3);
    });

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

    it('allows partial settings update', async () => {
      const user = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const settingsInput = {
        loanPrincipalExpenseTypeId: 5,
      };

      const response = await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token))
        .send(settingsInput)
        .expect(200);

      expect(response.body.loanPrincipalExpenseTypeId).toBe(5);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .put('/auth/user/settings')
        .send({ loanPrincipalExpenseTypeId: 1 })
        .expect(401);
    });

    it('preserves user identity after settings update', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const settingsInput = {
        loanPrincipalExpenseTypeId: 10,
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

      await request(server)
        .put('/auth/user/settings')
        .set('Authorization', getBearerToken(token1))
        .send({ loanPrincipalExpenseTypeId: 99 })
        .expect(200);

      const response2 = await request(server)
        .get('/auth/user')
        .set('Authorization', getBearerToken(token2))
        .expect(200);

      expect(response2.body.loanPrincipalExpenseTypeId).not.toBe(99);
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

  describe('User defaults', () => {
    beforeEach(async () => {
      await emptyTables(dataSource, [
        'expense',
        'expense_type',
        'income',
        'income_type',
        'transaction',
        'ownership',
        'user',
        'property',
        'property_statistics',
      ]);
    });

    describe('Default templates seeding', () => {
      it('seeds default expense types on app startup', async () => {
        const repo = dataSource.getRepository(ExpenseTypeDefault);
        const defaults = await repo.find();

        expect(defaults.length).toBe(13);
      });

      it('seeds default income types on app startup', async () => {
        const repo = dataSource.getRepository(IncomeTypeDefault);
        const defaults = await repo.find();

        expect(defaults.length).toBe(4);
      });
    });

    describe('New user initialization', () => {
      it('creates 13 expense types for a new user after first login', async () => {
        await authService.login({
          firstName: 'New',
          lastName: 'User',
          email: 'new@test.com',
          language: 'fi',
        });

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'new@test.com' },
        });

        const expenseTypeRepo = dataSource.getRepository(ExpenseType);
        const expenseTypes = await expenseTypeRepo.find({
          where: { userId: user.id },
        });

        expect(expenseTypes.length).toBe(13);
      });

      it('creates 4 income types for a new user after first login', async () => {
        await authService.login({
          firstName: 'New',
          lastName: 'User',
          email: 'new2@test.com',
          language: 'fi',
        });

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'new2@test.com' },
        });

        const incomeTypeRepo = dataSource.getRepository(IncomeType);
        const incomeTypes = await incomeTypeRepo.find({
          where: { userId: user.id },
        });

        expect(incomeTypes.length).toBe(4);
      });

      it('uses Finnish names when user language is fi', async () => {
        await authService.login({
          firstName: 'Finnish',
          lastName: 'User',
          email: 'fi@test.com',
          language: 'fi',
        });

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'fi@test.com' },
        });

        const expenseTypeRepo = dataSource.getRepository(ExpenseType);
        const expenseTypes = await expenseTypeRepo.find({
          where: { userId: user.id },
        });

        const names = expenseTypes.map((t) => t.name);
        expect(names).toContain('Yhtiövastike');
        expect(names).toContain('Lainan korko');
      });

      it('uses English names when user language is en', async () => {
        await authService.login({
          firstName: 'English',
          lastName: 'User',
          email: 'en@test.com',
          language: 'en',
        });

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'en@test.com' },
        });

        const expenseTypeRepo = dataSource.getRepository(ExpenseType);
        const expenseTypes = await expenseTypeRepo.find({
          where: { userId: user.id },
        });

        const names = expenseTypes.map((t) => t.name);
        expect(names).toContain('Housing company charge');
        expect(names).toContain('Loan interest');
      });

      it('maps loan settings on user entity', async () => {
        await authService.login({
          firstName: 'Loan',
          lastName: 'User',
          email: 'loan@test.com',
          language: 'fi',
        });

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'loan@test.com' },
        });

        expect(user.loanInterestExpenseTypeId).toBeDefined();
        expect(user.loanPrincipalExpenseTypeId).toBeDefined();
        expect(user.loanHandlingFeeExpenseTypeId).toBeDefined();

        // Verify they point to actual expense types
        const expenseTypeRepo = dataSource.getRepository(ExpenseType);

        const interestType = await expenseTypeRepo.findOne({
          where: { id: user.loanInterestExpenseTypeId },
        });
        expect(interestType).toBeDefined();
        expect(interestType.name).toBe('Lainan korko');

        const principalType = await expenseTypeRepo.findOne({
          where: { id: user.loanPrincipalExpenseTypeId },
        });
        expect(principalType).toBeDefined();
        expect(principalType.name).toBe('Lainan lyhennys');

        const handlingFeeType = await expenseTypeRepo.findOne({
          where: { id: user.loanHandlingFeeExpenseTypeId },
        });
        expect(handlingFeeType).toBeDefined();
        expect(handlingFeeType.name).toBe('Lainan käsittelykulut');
      });

      it('does not duplicate types on re-login', async () => {
        const userInput = {
          firstName: 'Repeat',
          lastName: 'User',
          email: 'repeat@test.com',
          language: 'fi',
        };

        // First login
        await authService.login(userInput);

        // Second login
        await authService.login(userInput);

        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { email: 'repeat@test.com' },
        });

        const expenseTypeRepo = dataSource.getRepository(ExpenseType);
        const expenseTypes = await expenseTypeRepo.find({
          where: { userId: user.id },
        });

        expect(expenseTypes.length).toBe(13);

        const incomeTypeRepo = dataSource.getRepository(IncomeType);
        const incomeTypes = await incomeTypeRepo.find({
          where: { userId: user.id },
        });

        expect(incomeTypes.length).toBe(4);
      });
    });
  });
});
