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
  addTransactionsToTestUsers,
} from './helper-functions';
import * as http from 'http';
import { TransactionStatus } from '@alisa-backend/common/types';

describe('Transaction Delete (e2e)', () => {
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
    await addTransactionsToTestUsers(app, testUsers);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /accounting/transaction/delete', () => {
    it('deletes transactions successfully when user has ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // First, get existing transactions
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token))
        .send({
          where: {
            propertyId: user.properties[0].id,
            status: TransactionStatus.ACCEPTED,
          },
        })
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const transactionIds = searchResponse.body.slice(0, 2).map((t: { id: number }) => t.id);

      // Delete the transactions
      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(token))
        .send({ ids: transactionIds })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(true);
      expect(deleteResponse.body.results).toHaveLength(transactionIds.length);

      // Verify transactions are deleted
      const verifyResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token))
        .send({
          where: {
            id: { $in: transactionIds },
          },
        })
        .expect(200);

      expect(verifyResponse.body.length).toBe(0);
    });

    it('returns 400 when no ids provided', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(token))
        .send({ ids: [] })
        .expect(400);
    });

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/accounting/transaction/delete')
        .send({ ids: [1, 2, 3] })
        .expect(401);
    });

    it('returns unauthorized status for transactions user does not own', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Get user2's transactions
      const searchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token2))
        .send({
          where: {
            propertyId: user2.properties[0].id,
            status: TransactionStatus.ACCEPTED,
          },
        })
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const user2TransactionId = searchResponse.body[0].id;

      // Try to delete user2's transaction as user1
      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(token1))
        .send({ ids: [user2TransactionId] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.results).toHaveLength(1);
      expect(deleteResponse.body.results[0].statusCode).toBe(401);

      // Verify transaction still exists
      const verifyResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token2))
        .send({
          where: {
            id: user2TransactionId,
          },
        })
        .expect(200);

      expect(verifyResponse.body.length).toBe(1);
    });

    it('handles mixed ownership - deletes only owned transactions', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Get user1's transaction
      const user1SearchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token1))
        .send({
          where: {
            propertyId: user1.properties[1].id,
            status: TransactionStatus.ACCEPTED,
          },
        })
        .expect(200);

      // Get user2's transaction
      const user2SearchResponse = await request(server)
        .post('/accounting/transaction/search')
        .set('Authorization', getBearerToken(token2))
        .send({
          where: {
            propertyId: user2.properties[0].id,
            status: TransactionStatus.ACCEPTED,
          },
        })
        .expect(200);

      expect(user1SearchResponse.body.length).toBeGreaterThan(0);
      expect(user2SearchResponse.body.length).toBeGreaterThan(0);

      const user1TransactionId = user1SearchResponse.body[0].id;
      const user2TransactionId = user2SearchResponse.body[0].id;

      // Try to delete both as user1
      const deleteResponse = await request(server)
        .post('/accounting/transaction/delete')
        .set('Authorization', getBearerToken(token1))
        .send({ ids: [user1TransactionId, user2TransactionId] })
        .expect(201);

      expect(deleteResponse.body.allSuccess).toBe(false);
      expect(deleteResponse.body.results).toHaveLength(2);

      // One should succeed, one should fail
      const successResults = deleteResponse.body.results.filter(
        (r: { statusCode: number }) => r.statusCode === 200,
      );
      const failResults = deleteResponse.body.results.filter(
        (r: { statusCode: number }) => r.statusCode === 401,
      );

      expect(successResults).toHaveLength(1);
      expect(failResults).toHaveLength(1);
    });
  });
});
