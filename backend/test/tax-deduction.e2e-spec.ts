import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import { PropertyService } from '@asset-backend/real-estate/property/property.service';
import {
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from './helper-functions';
import { TaxDeductionType } from '@asset-backend/common/types';
import * as http from 'http';

describe('TaxDeductionController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let propertyService: PropertyService;
  let testUsers: TestUsersSetup;
  let mainUser: TestUser;
  let propertyId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);
    propertyService = app.get(PropertyService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainUser = testUsers.user1WithProperties;
    propertyId = mainUser.properties[0].id;

    // Set property as Airbnb with distance
    await propertyService.update(mainUser.jwtUser, propertyId, {
      ...mainUser.properties[0],
      isAirbnb: true,
      distanceFromHome: 25,
      ownerships: [{ userId: mainUser.jwtUser.id, share: 100 }],
    });
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /real-estate/property/tax/deductions', () => {
    it('should create a travel deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.TRAVEL,
          amount: 360,
          metadata: { distanceKm: 25, visits: 24, ratePerKm: 0.30 },
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.amount).toBe(360);
      expect(response.body.typeName).toBe('travel');
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.distanceKm).toBe(25);
      expect(response.body.metadata.visits).toBe(24);
    });

    it('should create a laundry deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.LAUNDRY,
          amount: 200,
          metadata: { pricePerLaundry: 10, visits: 20 },
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.amount).toBe(200);
      expect(response.body.typeName).toBe('laundry');
    });

    it('should create a custom deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'Test custom deduction',
          amount: 100,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.description).toBe('Test custom deduction');
      expect(response.body.amount).toBe(100);
      expect(response.body.typeName).toBe('custom');
    });

    it('should return 401 when not authenticated', async () => {
      await request(server)
        .post('/real-estate/property/tax/deductions')
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          amount: 100,
        })
        .expect(401);
    });

    it('should return 401 when creating deduction for another user property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const otherUserProperty = testUsers.user2WithProperties.properties[0];

      await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId: otherUserProperty.id,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          amount: 100,
        })
        .expect(401);
    });
  });

  describe('GET /real-estate/property/tax/deductions', () => {
    it('should return deductions for year', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025 })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should return deductions for specific property and year', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025, propertyId: propertyId.toString() })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      response.body.forEach((deduction: { propertyId: number; year: number }) => {
        expect(deduction.propertyId).toBe(propertyId);
        expect(deduction.year).toBe(2025);
      });
    });

    it('should return empty array for year with no deductions', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2020 })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025 })
        .expect(401);
    });
  });

  describe('GET /real-estate/property/tax/deductions/calculate', () => {
    it('should return calculation preview for property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions/calculate')
        .query({ propertyId: propertyId.toString(), year: 2025 })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.distanceKm).toBe(25);
      expect(response.body.ratePerKm).toBeDefined();
      expect(response.body.defaultLaundryPrice).toBeDefined();
      expect(response.body.visits).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(server)
        .get('/real-estate/property/tax/deductions/calculate')
        .query({ propertyId: propertyId.toString(), year: 2025 })
        .expect(401);
    });

    it('should return 401 when accessing another user property', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const otherUserProperty = testUsers.user2WithProperties.properties[0];

      await request(server)
        .get('/real-estate/property/tax/deductions/calculate')
        .query({ propertyId: otherUserProperty.id.toString(), year: 2025 })
        .set('Authorization', getBearerToken(token))
        .expect(401);
    });
  });

  describe('GET /real-estate/property/tax/deductions/rates', () => {
    it('should return current year rates by default', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions/rates')
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.year).toBeDefined();
      expect(response.body.ratePerKm).toBeDefined();
      expect(response.body.defaultLaundryPrice).toBeDefined();
      expect(typeof response.body.ratePerKm).toBe('number');
    });

    it('should return rates for specific year', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions/rates')
        .query({ year: '2024' })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.year).toBe(2024);
      expect(response.body.ratePerKm).toBeDefined();
    });
  });

  describe('PUT /real-estate/property/tax/deductions/:id', () => {
    it('should update a deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // First create a deduction
      const createResponse = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'Original description',
          amount: 50,
        })
        .expect(201);

      const id = createResponse.body.id;

      // Update it
      const updateResponse = await request(server)
        .put(`/real-estate/property/tax/deductions/${id}`)
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'Updated description',
          amount: 75,
        })
        .expect(200);

      expect(updateResponse.body.id).toBe(id);
      expect(updateResponse.body.description).toBe('Updated description');
      expect(updateResponse.body.amount).toBe(75);
    });

    it('should return 401 when updating another user deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);

      // User1 creates a deduction
      const createResponse = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'User1 deduction',
          amount: 50,
        })
        .expect(201);

      const id = createResponse.body.id;

      // User2 tries to update it
      await request(server)
        .put(`/real-estate/property/tax/deductions/${id}`)
        .set('Authorization', getBearerToken(token2))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'Hacked description',
          amount: 1000,
        })
        .expect(401);
    });
  });

  describe('DELETE /real-estate/property/tax/deductions/:id', () => {
    it('should delete a deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);

      // First create one to delete
      const createResponse = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'To delete',
          amount: 50,
        })
        .expect(201);

      const id = createResponse.body.id;

      await request(server)
        .delete(`/real-estate/property/tax/deductions/${id}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Verify it's deleted by trying to get it
      const getResponse = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025 })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      const deleted = getResponse.body.find((d: { id: number }) => d.id === id);
      expect(deleted).toBeUndefined();
    });

    it('should return 401 when deleting another user deduction', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);

      // User1 creates a deduction
      const createResponse = await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token))
        .send({
          propertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'User1 deduction',
          amount: 50,
        })
        .expect(201);

      const id = createResponse.body.id;

      // User2 tries to delete it
      await request(server)
        .delete(`/real-estate/property/tax/deductions/${id}`)
        .set('Authorization', getBearerToken(token2))
        .expect(401);
    });

    it('should return 401 when not authenticated', async () => {
      await request(server)
        .delete('/real-estate/property/tax/deductions/999')
        .expect(401);
    });
  });

  describe('User isolation', () => {
    it('user2 cannot see user1 deductions', async () => {
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);

      const response = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025 })
        .set('Authorization', getBearerToken(token2))
        .expect(200);

      // User2 should only see their own deductions (none created in this test)
      const user1Deductions = response.body.filter((d: { propertyId: number }) => d.propertyId === propertyId);
      expect(user1Deductions.length).toBe(0);
    });

    it('user1 only sees their own deductions', async () => {
      const token = await getUserAccessToken2(authService, mainUser.jwtUser);
      const token2 = await getUserAccessToken2(authService, testUsers.user2WithProperties.jwtUser);
      const user2PropertyId = testUsers.user2WithProperties.properties[0].id;

      // User2 creates a deduction
      await request(server)
        .post('/real-estate/property/tax/deductions')
        .set('Authorization', getBearerToken(token2))
        .send({
          propertyId: user2PropertyId,
          year: 2025,
          deductionType: TaxDeductionType.CUSTOM,
          description: 'User2 deduction',
          amount: 999,
        })
        .expect(201);

      // User1 should not see user2's deduction
      const response = await request(server)
        .get('/real-estate/property/tax/deductions')
        .query({ year: 2025 })
        .set('Authorization', getBearerToken(token))
        .expect(200);

      const user2Deductions = response.body.filter((d: { propertyId: number }) => d.propertyId === user2PropertyId);
      expect(user2Deductions.length).toBe(0);
    });
  });
});
