import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

describe('FeedbackController (e2e)', () => {
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

  describe('POST /feedback', () => {
    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/feedback')
        .send({ message: 'Test feedback', type: 'general' })
        .expect(401);
    });

    it('creates feedback when authenticated', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: 'This is my feedback',
          type: 'general',
          page: '/dashboard',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('This is my feedback');
      expect(response.body.type).toBe('general');
      expect(response.body.page).toBe('/dashboard');
      expect(response.body.userId).toBe(user.jwtUser.id);
    });

    it('creates bug report feedback', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: 'Found a bug in the system',
          type: 'bug',
          page: '/properties',
        })
        .expect(201);

      expect(response.body.type).toBe('bug');
    });

    it('creates feature request feedback', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: 'Please add a mobile app',
          type: 'feature',
        })
        .expect(201);

      expect(response.body.type).toBe('feature');
    });

    it('creates feedback without page', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: 'General feedback without page',
          type: 'general',
        })
        .expect(201);

      expect(response.body.page).toBeNull();
    });

    it('returns 400 for empty message', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: '',
          type: 'general',
        })
        .expect(400);
    });

    it('returns 400 for invalid feedback type', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .post('/feedback')
        .set('Authorization', getBearerToken(token))
        .send({
          message: 'Test',
          type: 'invalid_type',
        })
        .expect(400);
    });
  });
});
