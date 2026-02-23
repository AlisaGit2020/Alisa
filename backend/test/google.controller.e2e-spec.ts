import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';

describe('GoogleController (e2e)', () => {
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

  describe('GET /google/gmail/authenticate', () => {
    it('returns 401 when not authenticated', async () => {
      await request(server).get('/google/gmail/authenticate').expect(401);
    });

    it('returns authentication URL or success when authenticated', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .get('/google/gmail/authenticate')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Endpoint returns either a Google OAuth URL or /success
      expect(response.body).toHaveProperty('url');
      expect(typeof response.body.url).toBe('string');

      // URL should be either a Google OAuth URL or /success
      const isGoogleAuthUrl = response.body.url.includes(
        'accounts.google.com/o/oauth2',
      );
      const isSuccessUrl = response.body.url === '/success';
      expect(isGoogleAuthUrl || isSuccessUrl).toBe(true);
    });

    it('returns 401 with invalid token', async () => {
      await request(server)
        .get('/google/gmail/authenticate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
