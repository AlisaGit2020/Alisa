import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MOCKS_PATH } from '@asset-backend/constants';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  addIncomeAndExpenseTypes,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';

describe('OpImportController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let otherUser: TestUser;
  let mainUserToken: string;
  let otherUserToken: string;

  const csvFilePath = `${MOCKS_PATH}/import/op.transactions.csv`;

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
    otherUser = testUsers.user2WithProperties;

    mainUserToken = await getUserAccessToken2(authService, mainUser.jwtUser);
    otherUserToken = await getUserAccessToken2(authService, otherUser.jwtUser);

    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /import/op', () => {
    it('successfully imports OP bank CSV file', async () => {
      const propertyId = mainUser.properties[0].id;

      const response = await request(server)
        .post('/import/op')
        .set('Authorization', getBearerToken(mainUserToken))
        .attach('file', csvFilePath)
        .field('propertyId', propertyId)
        .expect(201);

      expect(response.body).toHaveProperty('savedIds');
      expect(response.body).toHaveProperty('skippedCount');
      expect(response.body).toHaveProperty('totalRows');
      expect(Array.isArray(response.body.savedIds)).toBe(true);
      expect(response.body.savedIds.length).toBeGreaterThan(0);
      expect(response.body.totalRows).toBe(20);
    });

    it('returns 401 without authentication', async () => {
      const propertyId = mainUser.properties[0].id;

      await request(server)
        .post('/import/op')
        .attach('file', csvFilePath)
        .field('propertyId', propertyId)
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      const propertyId = mainUser.properties[0].id;

      await request(server)
        .post('/import/op')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', csvFilePath)
        .field('propertyId', propertyId)
        .expect(401);
    });

    it('returns 401 when trying to import to another user property', async () => {
      // Try to import to mainUser's property using otherUser's token
      const mainUserPropertyId = mainUser.properties[0].id;

      await request(server)
        .post('/import/op')
        .set('Authorization', getBearerToken(otherUserToken))
        .attach('file', csvFilePath)
        .field('propertyId', mainUserPropertyId)
        .expect(401);
    });

    it('returns 404 when property does not exist', async () => {
      const nonExistentPropertyId = 99999;

      await request(server)
        .post('/import/op')
        .set('Authorization', getBearerToken(mainUserToken))
        .attach('file', csvFilePath)
        .field('propertyId', nonExistentPropertyId)
        .expect(404);
    });

    it('returns 400 when file is not provided', async () => {
      const propertyId = mainUser.properties[0].id;

      await request(server)
        .post('/import/op')
        .set('Authorization', getBearerToken(mainUserToken))
        .field('propertyId', propertyId)
        .expect(400);
    });
  });
});
