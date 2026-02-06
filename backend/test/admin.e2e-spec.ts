import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { UserService } from '@alisa-backend/people/user/user.service';
import {
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';

describe('Admin endpoints (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let authService: AuthService;
  let userService: UserService;
  let testUsers: TestUsersSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    userService = app.get(UserService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe('GET /admin/users', () => {
    it('admin user can access and receive user list', async () => {
      const adminUser = testUsers.user1WithProperties;

      // Set user as admin directly in database
      await userService.update(adminUser.user.id, {
        ...adminUser.jwtUser,
        isAdmin: true,
      } as any);

      // Re-login to get updated JWT with isAdmin
      const token = await getUserAccessToken2(authService, {
        ...adminUser.jwtUser,
        isAdmin: true,
      });

      const response = await request(server)
        .get('/admin/users')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('firstName');
      expect(response.body[0]).toHaveProperty('lastName');
      expect(response.body[0]).toHaveProperty('email');
    });

    it('non-admin user gets 403', async () => {
      const nonAdminUser = testUsers.user2WithProperties;
      const token = await getUserAccessToken2(
        authService,
        nonAdminUser.jwtUser,
      );

      await request(server)
        .get('/admin/users')
        .set('Authorization', getBearerToken(token))
        .expect(403);
    });

    it('unauthenticated request gets 401', async () => {
      await request(server).get('/admin/users').expect(401);
    });

    it('invalid token gets 401', async () => {
      await request(server)
        .get('/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
