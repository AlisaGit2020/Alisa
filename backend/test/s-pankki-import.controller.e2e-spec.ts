import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
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
import { MOCKS_PATH } from '@alisa-backend/constants';

describe('SPankkiImportController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;

  const sPankkiCsvPath = path.join(MOCKS_PATH, 'import', 's-pankki.transactions.csv');

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

  describe('POST /import/s-pankki', () => {
    it('imports S-Pankki CSV file successfully', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      const response = await request(server)
        .post('/import/s-pankki')
        .set('Authorization', getBearerToken(token))
        .attach('file', sPankkiCsvPath)
        .field('propertyId', propertyId.toString())
        .expect(201);

      expect(response.body.savedIds).toBeDefined();
      expect(response.body.savedIds.length).toBeGreaterThan(0);
      expect(response.body.totalRows).toBeGreaterThan(0);
      expect(response.body.skippedCount).toBe(0);
    });

    it('returns 401 when not authenticated', async () => {
      const user = testUsers.user1WithProperties;
      const propertyId = user.properties[0].id;

      await request(server)
        .post('/import/s-pankki')
        .attach('file', sPankkiCsvPath)
        .field('propertyId', propertyId.toString())
        .expect(401);
    });

    it('returns 401 when trying to import to another user property', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const user2PropertyId = user2.properties[0].id;

      // User 1 tries to import to User 2's property
      await request(server)
        .post('/import/s-pankki')
        .set('Authorization', getBearerToken(token1))
        .attach('file', sPankkiCsvPath)
        .field('propertyId', user2PropertyId.toString())
        .expect(401);
    });

    it('returns 400 when no file is provided', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      await request(server)
        .post('/import/s-pankki')
        .set('Authorization', getBearerToken(token))
        .field('propertyId', propertyId.toString())
        .expect(400);
    });

    it('returns 404 when property does not exist', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const nonExistentPropertyId = 9999;

      await request(server)
        .post('/import/s-pankki')
        .set('Authorization', getBearerToken(token))
        .attach('file', sPankkiCsvPath)
        .field('propertyId', nonExistentPropertyId.toString())
        .expect(404);
    });
  });
});
