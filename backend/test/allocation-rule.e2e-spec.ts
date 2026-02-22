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
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import {
  TransactionStatus,
  TransactionType,
} from '@alisa-backend/common/types';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';

describe('AllocationRuleController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let transactionService: TransactionService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let mainUserToken: string;
  let otherUser: TestUser;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let otherUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    transactionService = app.get(TransactionService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    otherUser = testUsers.user2WithProperties;

    mainUserToken = await getUserAccessToken2(authService, mainUser.jwtUser);
    otherUserToken = await getUserAccessToken2(authService, otherUser.jwtUser);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  // ==========================================
  // 1. POST /allocation-rules
  // ==========================================
  describe('POST /allocation-rules', () => {
    it('creates a new allocation rule', async () => {
      const response = await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Rent Payment Rule',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'rent' },
          ],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Rent Payment Rule');
      expect(response.body.transactionType).toBe(TransactionType.EXPENSE);
      expect(response.body.conditions).toHaveLength(1);
    });

    it('returns 401 for unauthorized property', async () => {
      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Test Rule',
          propertyId: otherUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'test' },
          ],
        })
        .expect(401);
    });

    it('returns 400 for empty conditions', async () => {
      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Test Rule',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [],
        })
        .expect(400);
    });
  });

  // ==========================================
  // 2. GET /allocation-rules/property/:propertyId
  // ==========================================
  describe('GET /allocation-rules/property/:propertyId', () => {
    it('returns rules for property', async () => {
      // First create a rule
      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Test Rule for List',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.INCOME,
          conditions: [
            { field: 'sender', operator: 'equals', value: 'tenant' },
          ],
        })
        .expect(201);

      const response = await request(server)
        .get(`/allocation-rules/property/${mainUser.properties[0].id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
    });

    it('returns 401 for unauthorized property', async () => {
      await request(server)
        .get(`/allocation-rules/property/${otherUser.properties[0].id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(401);
    });
  });

  // ==========================================
  // 3. PUT /allocation-rules/:id
  // ==========================================
  describe('PUT /allocation-rules/:id', () => {
    it('updates an allocation rule', async () => {
      // Create a rule
      const createResponse = await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Rule to Update',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'old' },
          ],
        })
        .expect(201);

      // Update the rule
      const updateResponse = await request(server)
        .put(`/allocation-rules/${createResponse.body.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Updated Rule Name',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'new' },
          ],
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Rule Name');
      expect(updateResponse.body.conditions[0].value).toBe('new');
    });
  });

  // ==========================================
  // 4. DELETE /allocation-rules/:id
  // ==========================================
  describe('DELETE /allocation-rules/:id', () => {
    it('deletes an allocation rule', async () => {
      // Create a rule
      const createResponse = await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Rule to Delete',
          propertyId: mainUser.properties[0].id,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'delete' },
          ],
        })
        .expect(201);

      // Delete the rule
      await request(server)
        .delete(`/allocation-rules/${createResponse.body.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(204);

      // Verify it's deleted
      await request(server)
        .get(`/allocation-rules/${createResponse.body.id}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(404);
    });
  });

  // ==========================================
  // 5. POST /allocation-rules/apply
  // ==========================================
  describe('POST /allocation-rules/apply', () => {
    it('allocates transaction when rule matches', async () => {
      const propertyId = mainUser.properties[1].id;

      // Create a pending transaction
      const transaction: TransactionInputDto = {
        propertyId,
        sender: 'Tenant Name',
        receiver: 'Landlord',
        description: 'Monthly rent payment for February',
        transactionDate: new Date('2024-02-01'),
        accountingDate: new Date('2024-02-01'),
        amount: 1000,
        status: TransactionStatus.PENDING,
        type: TransactionType.UNKNOWN,
      };

      const createdTransaction = await transactionService.add(
        mainUser.jwtUser,
        transaction,
      );

      // Create a rule that matches
      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Rent Income Rule',
          propertyId,
          transactionType: TransactionType.INCOME,
          conditions: [
            { field: 'description', operator: 'contains', value: 'rent' },
          ],
        })
        .expect(201);

      // Apply allocation
      const response = await request(server)
        .post('/allocation-rules/apply')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          propertyId,
          transactionIds: [createdTransaction.id],
        })
        .expect(200);

      expect(response.body.allocated).toHaveLength(1);
      expect(response.body.allocated[0].transactionId).toBe(createdTransaction.id);
    });

    it('reports conflict when multiple rules match', async () => {
      const propertyId = mainUser.properties[1].id;

      // Create a pending transaction
      const transaction: TransactionInputDto = {
        propertyId,
        sender: 'Payment Sender',
        receiver: 'Payment Receiver',
        description: 'Utility bill payment',
        transactionDate: new Date('2024-02-15'),
        accountingDate: new Date('2024-02-15'),
        amount: -150,
        status: TransactionStatus.PENDING,
        type: TransactionType.UNKNOWN,
      };

      const createdTransaction = await transactionService.add(
        mainUser.jwtUser,
        transaction,
      );

      // Create two conflicting rules
      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Utility Rule',
          propertyId,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'utility' },
          ],
        })
        .expect(201);

      await request(server)
        .post('/allocation-rules')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          name: 'Bill Rule',
          propertyId,
          transactionType: TransactionType.EXPENSE,
          conditions: [
            { field: 'description', operator: 'contains', value: 'bill' },
          ],
        })
        .expect(201);

      // Apply allocation
      const response = await request(server)
        .post('/allocation-rules/apply')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          propertyId,
          transactionIds: [createdTransaction.id],
        })
        .expect(200);

      expect(response.body.conflicting).toHaveLength(1);
      expect(response.body.conflicting[0].matchingRules).toHaveLength(2);
    });

    it('returns 401 for unauthorized property', async () => {
      await request(server)
        .post('/allocation-rules/apply')
        .set('Authorization', getBearerToken(mainUserToken))
        .send({
          propertyId: otherUser.properties[0].id,
          transactionIds: [1],
        })
        .expect(401);
    });
  });

  // ==========================================
  // 6. PUT /allocation-rules/reorder
  // ==========================================
  describe('PUT /allocation-rules/reorder', () => {
    it('reorders rules', async () => {
      const propertyId = mainUser.properties[0].id;

      // Get existing rules
      const listResponse = await request(server)
        .get(`/allocation-rules/property/${propertyId}`)
        .set('Authorization', getBearerToken(mainUserToken))
        .expect(200);

      if (listResponse.body.length >= 2) {
        const ruleIds = listResponse.body.map((r: { id: number }) => r.id);
        const reversedIds = [...ruleIds].reverse();

        const response = await request(server)
          .put('/allocation-rules/reorder')
          .set('Authorization', getBearerToken(mainUserToken))
          .send({
            propertyId,
            ruleIds: reversedIds,
          })
          .expect(200);

        expect(response.body[0].id).toBe(reversedIds[0]);
      }
    });
  });
});
