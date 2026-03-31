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
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { ChargeType } from '@asset-backend/common/types';
import * as http from 'http';
import { DataSource } from 'typeorm';
import { PropertyCharge } from '@asset-backend/real-estate/property/entities/property-charge.entity';

describe('PropertyChargeController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let dataSource: DataSource;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let otherUser: TestUser;
  let propertyId: number;
  let otherPropertyId: number;

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
    mainUser = testUsers.user1WithProperties;
    otherUser = testUsers.user2WithProperties;
    propertyId = mainUser.properties[0].id;
    otherPropertyId = otherUser.properties[0].id;
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  beforeEach(async () => {
    // Clean up charges before each test using query builder
    await dataSource
      .getRepository(PropertyCharge)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  describe('POST /api/real-estate/property/:id/charges', () => {
    it('should create a charge (201)', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: '2025-01-01',
          endDate: null,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.chargeType).toBe(ChargeType.MAINTENANCE_FEE);
      expect(response.body.amount).toBe(150);
      expect(response.body.propertyId).toBe(propertyId);
      expect(response.body.typeName).toBe('maintenance-fee');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(401);
    });

    it('should return 404 when creating charge for another user property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .post(`/api/real-estate/property/${otherPropertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(404);
    });

    it('should return 404 for non-existent property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .post('/api/real-estate/property/99999/charges')
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(404);
    });

    it('should auto-close previous open charge when creating new one', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // Create first charge
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
          endDate: null,
        })
        .expect(201);

      // Create second charge with new start date
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: '2025-07-01',
          endDate: null,
        })
        .expect(201);

      // Get all charges and verify first one was closed
      const response = await request(server)
        .get(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      const charges = response.body;
      const maintenanceCharges = charges.filter(
        (c: { chargeType: ChargeType }) => c.chargeType === ChargeType.MAINTENANCE_FEE,
      );
      const oldCharge = maintenanceCharges.find((c: { amount: number }) => c.amount === 100);
      expect(oldCharge.endDate).toBe('2025-06-30');
    });
  });

  describe('GET /api/real-estate/property/:id/charges', () => {
    beforeEach(async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // Create test charges via API
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: '2025-01-01',
        });

      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: '2025-01-01',
        });
    });

    it('should return all charges (200)', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      // Should have at least maintenance, financial, and auto-calculated total
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(server)
        .get(`/api/real-estate/property/${propertyId}/charges`)
        .expect(401);
    });

    it('should return 404 for another user property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .get(`/api/real-estate/property/${otherPropertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });
  });

  describe('GET /api/real-estate/property/:id/charges/current', () => {
    beforeEach(async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];

      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: lastMonthStr,
        });

      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: lastMonthStr,
        });

      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: 25,
          startDate: lastMonthStr,
        });
    });

    it('should return current charges (200)', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get(`/api/real-estate/property/${propertyId}/charges/current`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.maintenanceFee).toBe(150);
      expect(response.body.financialCharge).toBe(50);
      expect(response.body.waterPrepayment).toBe(25);
      expect(response.body.totalCharge).toBe(225); // Auto-calculated
    });

    it('should return null for missing charge types', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      // Use second property which has no charges
      const emptyPropertyId = mainUser.properties[1].id;

      const response = await request(server)
        .get(`/api/real-estate/property/${emptyPropertyId}/charges/current`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.maintenanceFee).toBeNull();
      expect(response.body.financialCharge).toBeNull();
      expect(response.body.waterPrepayment).toBeNull();
      expect(response.body.totalCharge).toBeNull();
    });
  });

  describe('PUT /api/real-estate/property/:id/charges/:chargeId', () => {
    let testChargeId: number;

    beforeEach(async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        });

      testChargeId = response.body.id;
    });

    it('should update charge (200)', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .put(`/api/real-estate/property/${propertyId}/charges/${testChargeId}`)
        .set('Authorization', getBearerToken(token))
        .send({
          amount: 150,
          endDate: '2025-12-31',
        })
        .expect(200);

      expect(response.body.amount).toBe(150);
      expect(response.body.endDate).toBe('2025-12-31');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(server)
        .put(`/api/real-estate/property/${propertyId}/charges/${testChargeId}`)
        .send({ amount: 150 })
        .expect(401);
    });

    it('should return 404 for non-existent charge', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .put(`/api/real-estate/property/${propertyId}/charges/99999`)
        .set('Authorization', getBearerToken(token))
        .send({ amount: 150 })
        .expect(404);
    });
  });

  describe('DELETE /api/real-estate/property/:id/charges/:chargeId', () => {
    let testChargeId: number;

    beforeEach(async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        });

      testChargeId = response.body.id;
    });

    it('should delete charge (200)', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .delete(`/api/real-estate/property/${propertyId}/charges/${testChargeId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Verify charge is deleted by trying to get it
      const charges = await dataSource.getRepository(PropertyCharge).findOneBy({ id: testChargeId });
      expect(charges).toBeNull();
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(server)
        .delete(`/api/real-estate/property/${propertyId}/charges/${testChargeId}`)
        .expect(401);
    });

    it('should return 404 for non-existent charge', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      await request(server)
        .delete(`/api/real-estate/property/${propertyId}/charges/99999`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });
  });

  describe('TOTAL_CHARGE auto-calculation', () => {
    it('should auto-calculate total when creating charges', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // Create maintenance fee
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Create financial charge
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Create water prepayment
      await request(server)
        .post(`/api/real-estate/property/${propertyId}/charges`)
        .set('Authorization', getBearerToken(token))
        .send({
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: 25,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Get current charges and verify total
      const response = await request(server)
        .get(`/api/real-estate/property/${propertyId}/charges/current`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.totalCharge).toBe(175); // 100 + 50 + 25
    });
  });
});