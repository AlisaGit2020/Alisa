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

describe('User endpoints (e2e)', () => {
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
});
