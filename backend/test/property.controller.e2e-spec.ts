import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { UserService } from '@alisa-backend/people/user/user.service';
import { TierService } from '@alisa-backend/admin/tier.service';
import { EventTrackerService } from '@alisa-backend/common/event-tracker.service';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { StatisticKey, TransactionStatus, TransactionType } from '@alisa-backend/common/types';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { UserInputDto } from '@alisa-backend/people/user/dtos/user-input.dto';
import { DataSource } from 'typeorm';
import {
  addIncomeAndExpenseTypes,
  addTier,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import {
  getTransactionIncome1,
  getTransactionIncome2,
} from './data/mocks/transaction.mock';
import * as http from 'http';

describe('PropertyController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let userService: UserService;
  let tierService: TierService;
  let eventTracker: EventTrackerService;
  let propertyStatisticsService: PropertyStatisticsService;
  let transactionService: TransactionService;
  let dataSource: DataSource;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    userService = app.get(UserService);
    tierService = app.get(TierService);
    eventTracker = app.get(EventTrackerService);
    propertyStatisticsService = app.get(PropertyStatisticsService);
    transactionService = app.get(TransactionService);
    dataSource = app.get(DataSource);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;

    // Add income and expense types needed for test transactions
    await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  // Helper to create test transaction
  const createTestTransaction = (
    propertyId: number,
    amount: number,
    type: TransactionType = TransactionType.INCOME,
  ): Transaction => {
    const transaction = new Transaction();
    transaction.id = Math.floor(Math.random() * 10000);
    transaction.propertyId = propertyId;
    transaction.status = TransactionStatus.ACCEPTED;
    transaction.type = type;
    transaction.sender = 'Test Sender';
    transaction.receiver = 'Test Receiver';
    transaction.description = 'Test Transaction';
    transaction.transactionDate = new Date('2023-03-15');
    transaction.accountingDate = new Date('2023-03-15');
    transaction.amount = amount;
    transaction.balance = amount;
    return transaction;
  };

  // =========================================================================
  // 1. POST /real-estate/property/search
  // =========================================================================
  describe('POST /real-estate/property/search', () => {
    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property/search')
        .send({})
        .expect(401);
    });

    it('returns properties with ownerships when requested', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/search')
        .set('Authorization', getBearerToken(token))
        .send({ relations: ['ownerships'] })
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      for (const property of response.body) {
        expect(property.ownerships).toBeDefined();
        expect(Array.isArray(property.ownerships)).toBe(true);
      }
    });

    it('only returns properties owned by the user', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const response1 = await request(server)
        .post('/real-estate/property/search')
        .set('Authorization', getBearerToken(token1))
        .send({})
        .expect(200);

      const response2 = await request(server)
        .post('/real-estate/property/search')
        .set('Authorization', getBearerToken(token2))
        .send({})
        .expect(200);

      const user1PropertyIds = response1.body.map((p: Property) => p.id);
      const user2PropertyIds = response2.body.map((p: Property) => p.id);

      const overlap = user1PropertyIds.filter((id: number) =>
        user2PropertyIds.includes(id),
      );
      expect(overlap.length).toBe(0);
    });
  });

  // =========================================================================
  // 2. GET /real-estate/property/:id
  // =========================================================================
  describe('GET /real-estate/property/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .get('/real-estate/property/1')
        .expect(401);
    });

    it('returns property when user has ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const property = user.properties[0];

      const response = await request(server)
        .get(`/real-estate/property/${property.id}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(property.id);
      expect(response.body.name).toBeDefined();
    });

    it('returns 404 when property does not exist', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .get('/real-estate/property/99999')
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 401 when accessing property without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user2Property = user2.properties[0];

      await request(server)
        .get(`/real-estate/property/${user2Property.id}`)
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });

    it('user1 properties are not visible to user2', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      const user1PropertyId = user1.properties[0].id;

      await request(server)
        .get(`/real-estate/property/${user1PropertyId}`)
        .set('Authorization', getBearerToken(token2))
        .expect(401);
    });
  });

  // =========================================================================
  // 3. POST /real-estate/property
  // =========================================================================
  describe('POST /real-estate/property', () => {
    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property')
        .send({ name: 'Test', size: 50 })
        .expect(401);
    });

    it('creates property with default 100% ownership for current user', async () => {
      const user = testUsers.userWithoutProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const propertyInput = {
        name: 'New Property',
        size: 50,
        ownerships: [{ share: 100 }],
      };

      const response = await request(server)
        .post('/real-estate/property')
        .set('Authorization', getBearerToken(token))
        .send(propertyInput)
        .expect(201);

      expect(response.body.name).toBe('New Property');
      expect(response.body.size).toBe(50);
      expect(response.body.ownerships).toBeDefined();
      expect(response.body.ownerships.length).toBe(1);
      expect(response.body.ownerships[0].share).toBe(100);
      expect(response.body.ownerships[0].userId).toBe(user.user.id);
    });

    it('creates property with partial ownership share', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const propertyInput = {
        name: 'Shared Property',
        size: 100,
        ownerships: [{ share: 50 }],
      };

      const response = await request(server)
        .post('/real-estate/property')
        .set('Authorization', getBearerToken(token))
        .send(propertyInput)
        .expect(201);

      expect(response.body.ownerships[0].share).toBe(50);
    });
  });

  // =========================================================================
  // 4. PUT /real-estate/property/:id
  // =========================================================================
  describe('PUT /real-estate/property/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .put('/real-estate/property/1')
        .send({ name: 'Updated', size: 100 })
        .expect(401);
    });

    it('updates property name without modifying ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const property = user.properties[0];

      const updateInput = {
        name: 'Updated Property Name',
        size: property.size,
      };

      const response = await request(server)
        .put(`/real-estate/property/${property.id}`)
        .set('Authorization', getBearerToken(token))
        .send(updateInput)
        .expect(200);

      expect(response.body.name).toBe('Updated Property Name');
    });

    it('updates property ownership share', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const property = user.properties[1];

      const updateInput = {
        name: property.name,
        size: property.size,
        ownerships: [{ share: 75 }],
      };

      const response = await request(server)
        .put(`/real-estate/property/${property.id}`)
        .set('Authorization', getBearerToken(token))
        .send(updateInput)
        .expect(200);

      expect(response.body.ownerships).toBeDefined();
      expect(response.body.ownerships[0].share).toBe(75);
      expect(response.body.ownerships[0].propertyId).toBe(property.id);
    });

    it('returns 401 when updating property without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user2Property = user2.properties[0];

      await request(server)
        .put(`/real-estate/property/${user2Property.id}`)
        .set('Authorization', getBearerToken(token1))
        .send({ name: 'Hacked Property', size: 100, ownerships: [{ share: 100 }] })
        .expect(401);
    });
  });

  // =========================================================================
  // 5. DELETE /real-estate/property/:id
  // =========================================================================
  describe('DELETE /real-estate/property/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .delete('/real-estate/property/1')
        .expect(401);
    });

    it('deletes property and cascades to ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const propertyInput = {
        name: 'Property to Delete',
        size: 30,
        ownerships: [{ share: 100 }],
      };

      const createResponse = await request(server)
        .post('/real-estate/property')
        .set('Authorization', getBearerToken(token))
        .send(propertyInput)
        .expect(201);

      const propertyId = createResponse.body.id;

      await request(server)
        .delete(`/real-estate/property/${propertyId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      await request(server)
        .get(`/real-estate/property/${propertyId}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 401 when deleting property without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user2Property = user2.properties[0];

      await request(server)
        .delete(`/real-estate/property/${user2Property.id}`)
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });
  });

  // =========================================================================
  // 6. POST /real-estate/property/statistics/search
  // =========================================================================
  describe('POST /real-estate/property/statistics/search', () => {
    beforeEach(async () => {
      await eventTracker.waitForPending();
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await eventTracker.waitForPending();
    });

    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property/statistics/search')
        .send({})
        .expect(401);
    });

    it('user can only see their own property statistics', async () => {
      const user1Property = mainUser.properties[0].id;
      const user2Property = testUsers.user2WithProperties.properties[0].id;

      // Add transactions for both users
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await transactionService.add(testUsers.user2WithProperties.jwtUser, getTransactionIncome2(user2Property));

      // Wait for event handlers
      await eventTracker.waitForPending();

      // Get auth token for user1
      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // User1 fetches all their statistics (no propertyId specified)
      const response = await request(server)
        .post('/real-estate/property/statistics/search')
        .set('Authorization', getBearerToken(user1Token))
        .send({})
        .expect(200);

      // Should only contain user1's property statistics
      const propertyIds = [...new Set(response.body.map((s: { propertyId: number }) => s.propertyId))];
      const user1PropertyIds = mainUser.properties.map((p) => p.id);

      // All returned statistics should belong to user1's properties
      for (const propId of propertyIds) {
        expect(user1PropertyIds).toContain(propId);
      }

      // Should NOT contain user2's property
      expect(propertyIds).not.toContain(user2Property);
    });

    it('user cannot see another user\'s property statistics with explicit propertyId', async () => {
      const user1Property = mainUser.properties[0].id;
      const user2Property = testUsers.user2WithProperties.properties[0].id;

      // Add transactions for both users
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await transactionService.add(testUsers.user2WithProperties.jwtUser, getTransactionIncome2(user2Property));

      // Wait for event handlers
      await eventTracker.waitForPending();

      // Verify user2 has statistics
      const user2Stats = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [user2Property]);
      expect(user2Stats.length).toBe(1);

      // Get auth token for user1
      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // User1 tries to access user2's property statistics by specifying propertyId
      const response = await request(server)
        .post('/real-estate/property/statistics/search')
        .set('Authorization', getBearerToken(user1Token))
        .send({ propertyId: user2Property })
        .expect(200);

      // User1 should NOT see user2's statistics - should return empty array
      expect(response.body).toEqual([]);
    });
  });

  // =========================================================================
  // 7. POST /real-estate/property/:id/statistics/search
  // =========================================================================
  describe('POST /real-estate/property/:id/statistics/search', () => {
    beforeEach(async () => {
      await eventTracker.waitForPending();
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await eventTracker.waitForPending();
    });

    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property/1/statistics/search')
        .send({})
        .expect(401);
    });

    it('returns property statistics for owned property', async () => {
      const user1Property = mainUser.properties[0].id;

      // Add transaction
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await eventTracker.waitForPending();

      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post(`/real-estate/property/${user1Property}/statistics/search`)
        .set('Authorization', getBearerToken(user1Token))
        .send({ key: StatisticKey.INCOME })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should return income statistics
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('user cannot see another user\'s property statistics', async () => {
      const user1Property = mainUser.properties[0].id;
      const user2Property = testUsers.user2WithProperties.properties[0].id;

      // Add transactions for both users
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await transactionService.add(testUsers.user2WithProperties.jwtUser, getTransactionIncome2(user2Property));

      // Wait for event handlers
      await eventTracker.waitForPending();

      // Get auth token for user1
      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // User1 tries to access user2's property statistics via /:id/statistics/search
      const response = await request(server)
        .post(`/real-estate/property/${user2Property}/statistics/search`)
        .set('Authorization', getBearerToken(user1Token))
        .send({ key: StatisticKey.INCOME })
        .expect(200);

      // User1 should NOT see user2's statistics - should return empty array
      expect(response.body).toEqual([]);
    });
  });

  // =========================================================================
  // 8. POST /real-estate/property/:id/photo
  // =========================================================================
  describe('POST /real-estate/property/:id/photo', () => {
    const testImagePath = path.join(__dirname, 'data', 'test-image.jpg');

    beforeAll(() => {
      // Create a simple test image file if it doesn't exist
      const testDataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }
      if (!fs.existsSync(testImagePath)) {
        // Create a minimal JPEG file (just the header)
        const jpegBuffer = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
        ]);
        fs.writeFileSync(testImagePath, jpegBuffer);
      }
    });

    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property/1/photo')
        .expect(401);
    });

    it('uploads photo for owned property', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      const response = await request(server)
        .post(`/real-estate/property/${propertyId}/photo`)
        .set('Authorization', getBearerToken(token))
        .attach('photo', testImagePath)
        .expect(201);

      expect(response.body.id).toBe(propertyId);
      expect(response.body.photo).toBeDefined();
    });

    it('returns 401 when uploading photo to property without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user2Property = user2.properties[0];

      await request(server)
        .post(`/real-estate/property/${user2Property.id}/photo`)
        .set('Authorization', getBearerToken(token1))
        .attach('photo', testImagePath)
        .expect(401);
    });
  });

  // =========================================================================
  // 9. DELETE /real-estate/property/:id/photo
  // =========================================================================
  describe('DELETE /real-estate/property/:id/photo', () => {
    it('requires authentication', async () => {
      await request(server)
        .delete('/real-estate/property/1/photo')
        .expect(401);
    });

    it('deletes photo for owned property', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      // First upload a photo
      const testImagePath = path.join(__dirname, 'data', 'test-image.jpg');
      await request(server)
        .post(`/real-estate/property/${propertyId}/photo`)
        .set('Authorization', getBearerToken(token))
        .attach('photo', testImagePath)
        .expect(201);

      // Then delete it
      const response = await request(server)
        .delete(`/real-estate/property/${propertyId}/photo`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(propertyId);
      expect(response.body.photo).toBeNull();
    });

    it('returns 401 when deleting photo from property without ownership', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);

      const user2Property = user2.properties[0];

      await request(server)
        .delete(`/real-estate/property/${user2Property.id}/photo`)
        .set('Authorization', getBearerToken(token1))
        .expect(401);
    });
  });

  // =========================================================================
  // 10. POST /real-estate/property/statistics/recalculate
  // =========================================================================
  describe('POST /real-estate/property/statistics/recalculate', () => {
    beforeEach(async () => {
      await eventTracker.waitForPending();
      await dataSource.query('DELETE FROM income');
      await dataSource.query('DELETE FROM expense');
      await dataSource.query('DELETE FROM property_statistics');
      await dataSource.query('DELETE FROM transaction');
      await eventTracker.waitForPending();
    });

    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/property/statistics/recalculate')
        .expect(401);
    });

    it('only recalculates statistics for the authenticated user\'s properties', async () => {
      const user1Property = mainUser.properties[0].id;
      const user2Property = testUsers.user2WithProperties.properties[0].id;

      // Add transactions for both users
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await transactionService.add(testUsers.user2WithProperties.jwtUser, getTransactionIncome2(user2Property));

      // Wait for event handlers
      await eventTracker.waitForPending();

      // Corrupt user1's statistics
      await dataSource.query(`
        UPDATE property_statistics SET value = '9999.00'
        WHERE "propertyId" = $1 AND "key" = 'income'
      `, [user1Property]);

      // Get auth tokens for both users
      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // User1 calls recalculate endpoint
      const response = await request(server)
        .post('/real-estate/property/statistics/recalculate')
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      // Verify response contains only user1's data
      expect(response.body.income.total).toBeCloseTo(249, 0);

      // Verify user1's stats were recalculated (back to correct value)
      const user1StatsAfter = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [user1Property]);
      expect(parseFloat(user1StatsAfter[0].value)).toBeCloseTo(249, 2);

      // Verify user2's stats were NOT affected
      const user2StatsAfter = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [user2Property]);
      expect(parseFloat(user2StatsAfter[0].value)).toBeCloseTo(1090, 2);
    });

    it('user cannot recalculate another user\'s property statistics', async () => {
      const user1Property = mainUser.properties[0].id;
      const user2Property = testUsers.user2WithProperties.properties[0].id;

      // Add transactions for both users
      await transactionService.add(mainUser.jwtUser, getTransactionIncome1(user1Property));
      await transactionService.add(testUsers.user2WithProperties.jwtUser, getTransactionIncome2(user2Property));

      // Wait for event handlers
      await eventTracker.waitForPending();

      // Corrupt user2's statistics to a known bad value
      await dataSource.query(`
        UPDATE property_statistics SET value = '9999.00'
        WHERE "propertyId" = $1 AND "key" = 'income'
      `, [user2Property]);

      // Get auth token for user1
      const user1Token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // User1 calls recalculate endpoint
      await request(server)
        .post('/real-estate/property/statistics/recalculate')
        .set('Authorization', getBearerToken(user1Token))
        .expect(200);

      // User2's corrupted stats should remain corrupted (not recalculated by user1)
      const user2StatsAfter = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'income' AND "year" IS NULL AND "month" IS NULL
      `, [user2Property]);
      expect(user2StatsAfter[0].value).toBe('9999.00');
    });

    it('returns empty stats when user has no properties', async () => {
      const user = testUsers.userWithoutProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // First, delete any properties created in earlier tests
      const properties = await dataSource.query(`
        SELECT p.id FROM property p
        JOIN ownership o ON o."propertyId" = p.id
        WHERE o."userId" = $1
      `, [user.user.id]);

      for (const prop of properties) {
        await request(server)
          .delete(`/real-estate/property/${prop.id}`)
          .set('Authorization', getBearerToken(token));
      }

      const response = await request(server)
        .post('/real-estate/property/statistics/recalculate')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.income.count).toBe(0);
      expect(response.body.income.total).toBe(0);
    });
  });

  // =========================================================================
  // Property Statistics Concurrency Tests
  // =========================================================================
  describe('Property statistics concurrency handling', () => {
    beforeEach(async () => {
      await eventTracker.waitForPending();
      await dataSource.query('TRUNCATE TABLE "property_statistics" RESTART IDENTITY CASCADE;');
    });

    it('handles concurrent transaction accepts without creating duplicate rows', async () => {
      const propertyId = mainUser.properties[0].id;

      // Create multiple transactions
      const transactions = [
        createTestTransaction(propertyId, 100),
        createTestTransaction(propertyId, 200),
        createTestTransaction(propertyId, 300),
        createTestTransaction(propertyId, 400),
        createTestTransaction(propertyId, 500),
      ];

      // Fire all events concurrently to simulate race condition
      await Promise.all(
        transactions.map((transaction) =>
          propertyStatisticsService.handleTransactionCreated({ transaction }),
        ),
      );

      // Check for duplicates - should have exactly 1 row per (propertyId, year, month, key) combination
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" = $1
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [propertyId]);

      expect(duplicates).toHaveLength(0);

      // Verify the values are correctly summed
      // For BALANCE key (all-time): 100 + 200 + 300 + 400 + 500 = 1500
      const balanceAllTime = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [propertyId]);

      expect(balanceAllTime).toHaveLength(1);
      expect(parseFloat(balanceAllTime[0].value)).toBe(1500);
    });

    it('correctly separates statistics by property', async () => {
      const property1Id = mainUser.properties[0].id;
      const property2Id = mainUser.properties[1].id;

      const transactions = [
        createTestTransaction(property1Id, 100),
        createTestTransaction(property1Id, 200),
        createTestTransaction(property2Id, 500),
        createTestTransaction(property2Id, 600),
      ];

      await Promise.all(
        transactions.map((transaction) =>
          propertyStatisticsService.handleTransactionCreated({ transaction }),
        ),
      );

      // Check for duplicates across both properties
      const duplicates = await dataSource.query(`
        SELECT "propertyId", "year", "month", "key", COUNT(*) as count
        FROM property_statistics
        WHERE "propertyId" IN ($1, $2)
        GROUP BY "propertyId", "year", "month", "key"
        HAVING COUNT(*) > 1
      `, [property1Id, property2Id]);

      expect(duplicates).toHaveLength(0);

      // Verify property 1 balance: 100 + 200 = 300
      const balance1 = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [property1Id]);
      expect(parseFloat(balance1[0].value)).toBe(300);

      // Verify property 2 balance: 500 + 600 = 1100
      const balance2 = await dataSource.query(`
        SELECT value FROM property_statistics
        WHERE "propertyId" = $1 AND "key" = 'balance' AND "year" IS NULL AND "month" IS NULL
      `, [property2Id]);
      expect(parseFloat(balance2[0].value)).toBe(1100);
    });
  });

  // =========================================================================
  // Tier Enforcement Tests (property creation limits)
  // =========================================================================
  describe('Tier enforcement on property creation', () => {
    // Helper to create user with tier
    const createUserWithTier = async (
      email: string,
      tierId: number,
    ): Promise<{ user: User; token: string; jwtUser: JWTUser }> => {
      const jwtUser: JWTUser = {
        id: 0,
        firstName: 'Test',
        lastName: 'User',
        email,
        language: 'fi',
        ownershipInProperties: [],
        isAdmin: false,
      };
      await userService.add(jwtUser as unknown as UserInputDto);
      const users = await userService.search({ where: { email } });
      const user = users[0];
      jwtUser.id = user.id;

      await tierService.assignTierToUser(user.id, tierId);

      const token = await getUserAccessToken2(authService, jwtUser);
      return { user, token, jwtUser };
    };

    const createPropertyRequest = async (token: string, name: string) => {
      return request(server)
        .post('/real-estate/property')
        .set('Authorization', getBearerToken(token))
        .send({ name, size: 50 });
    };

    // Reset database and setup tiers before each tier test
    const setupTierTest = async () => {
      await prepareDatabase(app);
      testUsers = await getTestUsers(app);
      mainUser = testUsers.user1WithProperties;
      await addIncomeAndExpenseTypes(mainUser.jwtUser, app);
    };

    describe('Free tier (max 1 property)', () => {
      let freeTierId: number;

      beforeAll(async () => {
        await setupTierTest();
        const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
        freeTierId = freeTier.id;
      });

      it('allows creating 1 property', async () => {
        const { token } = await createUserWithTier(
          'free-user@test.com',
          freeTierId,
        );

        const response = await createPropertyRequest(token, 'First Property');
        expect(response.status).toBe(201);
      });

      it('blocks creating a 2nd property', async () => {
        const { token, jwtUser } = await createUserWithTier(
          'free-user-2@test.com',
          freeTierId,
        );

        await createPropertyRequest(token, 'First Property');

        // Re-login to get updated token with ownership
        const newToken = await getUserAccessToken2(authService, jwtUser);

        const response = await createPropertyRequest(newToken, 'Second Property');
        expect(response.status).toBe(403);
      });
    });

    describe('Enterprise tier (unlimited)', () => {
      let enterpriseTierId: number;

      beforeAll(async () => {
        await setupTierTest();
        const enterpriseTier = await addTier(
          app,
          'Enterprise',
          29.99,
          0,
          false,
          3,
        );
        enterpriseTierId = enterpriseTier.id;
      });

      it('allows creating multiple properties', async () => {
        const { token, jwtUser } = await createUserWithTier(
          'enterprise-user@test.com',
          enterpriseTierId,
        );

        // Create first property
        const response1 = await createPropertyRequest(token, 'Property 1');
        expect(response1.status).toBe(201);

        // Re-login to get updated token
        const token2 = await getUserAccessToken2(authService, jwtUser);

        // Create second property
        const response2 = await createPropertyRequest(token2, 'Property 2');
        expect(response2.status).toBe(201);

        // Re-login and create third
        const token3 = await getUserAccessToken2(authService, jwtUser);
        const response3 = await createPropertyRequest(token3, 'Property 3');
        expect(response3.status).toBe(201);
      });
    });

    describe('Tier upgrade', () => {
      let freeTierId: number;
      let basicTierId: number;

      beforeAll(async () => {
        await setupTierTest();
        const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
        const basicTier = await addTier(app, 'Basic', 4.99, 5, false, 1);
        freeTierId = freeTier.id;
        basicTierId = basicTier.id;
      });

      it('allows more properties after tier upgrade', async () => {
        const { token, jwtUser, user } = await createUserWithTier(
          'upgrade-user@test.com',
          freeTierId,
        );

        // Create first property (should succeed)
        await createPropertyRequest(token, 'First Property');

        // Re-login
        const token2 = await getUserAccessToken2(authService, jwtUser);

        // Try second property (should fail with Free tier)
        const response = await createPropertyRequest(token2, 'Second Property');
        expect(response.status).toBe(403);

        // Upgrade to Basic tier
        await tierService.assignTierToUser(user.id, basicTierId);

        // Re-login after upgrade
        const token3 = await getUserAccessToken2(authService, jwtUser);

        // Now second property should succeed
        const response2 = await createPropertyRequest(token3, 'Second Property');
        expect(response2.status).toBe(201);
      });
    });

    describe('Property deletion frees slot', () => {
      let freeTierId: number;

      beforeAll(async () => {
        await setupTierTest();
        const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
        freeTierId = freeTier.id;
      });

      it('allows creating a new property after deleting one', async () => {
        const { token, jwtUser } = await createUserWithTier(
          'delete-user@test.com',
          freeTierId,
        );

        // Create first property
        const createResponse = await createPropertyRequest(token, 'First Property');
        expect(createResponse.status).toBe(201);
        const propertyId = createResponse.body.id;

        // Re-login
        const token2 = await getUserAccessToken2(authService, jwtUser);

        // Delete the property
        await request(server)
          .delete(`/real-estate/property/${propertyId}`)
          .set('Authorization', getBearerToken(token2))
          .expect(200);

        // Re-login
        const token3 = await getUserAccessToken2(authService, jwtUser);

        // Should now be able to create another property
        const response = await createPropertyRequest(token3, 'Replacement Property');
        expect(response.status).toBe(201);
      });
    });

    describe('Existing property operations at limit', () => {
      let freeTierId: number;

      beforeAll(async () => {
        await setupTierTest();
        const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
        freeTierId = freeTier.id;
      });

      it('allows viewing and updating existing properties at the limit', async () => {
        const { token, jwtUser } = await createUserWithTier(
          'limit-user@test.com',
          freeTierId,
        );

        // Create a property (at limit now)
        const createResponse = await createPropertyRequest(token, 'My Property');
        expect(createResponse.status).toBe(201);
        const propertyId = createResponse.body.id;

        // Re-login
        const token2 = await getUserAccessToken2(authService, jwtUser);

        // Should still be able to view
        const getResponse = await request(server)
          .get(`/real-estate/property/${propertyId}`)
          .set('Authorization', getBearerToken(token2))
          .expect(200);

        expect(getResponse.body.name).toBe('My Property');

        // Should still be able to update
        await request(server)
          .put(`/real-estate/property/${propertyId}`)
          .set('Authorization', getBearerToken(token2))
          .send({ name: 'Updated Property', size: 60 })
          .expect(200);
      });
    });
  });
});
