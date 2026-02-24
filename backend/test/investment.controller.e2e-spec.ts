import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  addTier,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import * as http from 'http';
import { Investment } from '@asset-backend/real-estate/investment/entities/investment.entity';
import * as nock from 'nock';
import * as fs from 'fs';
import * as path from 'path';
import { MOCKS_PATH } from '@asset-backend/constants';
import { PropertyStatus } from '@asset-backend/common/types';

describe('InvestmentController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let testUsers: TestUsersSetup;
  let mockHtml: string;

  beforeAll(async () => {
    // Ensure nock is active (may have been restored by other tests)
    if (!nock.isActive()) {
      nock.activate();
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    authService = app.get(AuthService);

    await prepareDatabase(app);
    await addTier(app, 'Free', 0, 100, true, 0);
    testUsers = await getTestUsers(app);

    // Load mock HTML
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'etuovi.property.html');
    mockHtml = fs.readFileSync(mockHtmlPath, 'utf-8');
  });

  afterAll(async () => {
    nock.cleanAll();
    nock.restore();
    await closeAppGracefully(app, server);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  const validCalculationInput = {
    deptFreePrice: 100000,
    deptShare: 50000,
    transferTaxPercent: 2,
    maintenanceFee: 200,
    chargeForFinancialCosts: 50,
    rentPerMonth: 800,
    apartmentSize: 50,
    waterCharge: 20,
    downPayment: 20000,
    loanInterestPercent: 3.5,
    loanPeriod: 25,
  };

  describe('POST /real-estate/investment/calculate', () => {
    it('returns calculated investment results without authentication', async () => {
      const response = await request(server)
        .post('/real-estate/investment/calculate')
        .send(validCalculationInput)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.sellingPrice).toBeDefined();
      expect(response.body.transferTax).toBeDefined();
      expect(response.body.rentalYieldPercent).toBeDefined();
      expect(response.body.cashFlowPerMonth).toBeDefined();
    });

    it('calculates correct values', async () => {
      const response = await request(server)
        .post('/real-estate/investment/calculate')
        .send(validCalculationInput)
        .expect(200);

      // Selling price = deptFreePrice - deptShare
      expect(response.body.sellingPrice).toBe(50000);
      // Transfer tax = deptFreePrice * transferTaxPercent / 100
      expect(response.body.transferTax).toBe(2000);
    });
  });

  describe('POST /real-estate/investment', () => {
    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/investment')
        .send(validCalculationInput)
        .expect(401);
    });

    it('saves calculation with authentication', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      const response = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Test Investment' })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(user.user.id);
      expect(response.body.name).toBe('Test Investment');
    });

    it('saves calculation with property association', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      const response = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({
          ...validCalculationInput,
          name: 'Property Investment',
          propertyId,
        })
        .expect(201);

      expect(response.body.propertyId).toBe(propertyId);
      expect(response.body.userId).toBe(user.user.id);
    });

    it('rejects property association when user does not own property', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const otherUserPropertyId = testUsers.user2WithProperties.properties[0].id;

      await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({
          ...validCalculationInput,
          propertyId: otherUserPropertyId,
        })
        .expect(401);
    });

    it('creates prospect property from etuoviUrl when no propertyId is set', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Mock the etuovi.com response
      nock('https://www.etuovi.com')
        .get('/kohde/99999999')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({
          ...validCalculationInput,
          name: 'Investment with Etuovi',
          etuoviUrl: 'https://www.etuovi.com/kohde/99999999',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.propertyId).toBeDefined();
      expect(response.body.propertyId).toBeGreaterThan(0);

      // Verify the property was created as PROSPECT
      const propertyResponse = await request(server)
        .get(`/real-estate/property/${response.body.propertyId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(propertyResponse.body.status).toBe(PropertyStatus.PROSPECT);
    });

    it('does not create prospect property when propertyId is already set', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const propertyId = user.properties[0].id;

      // If etuoviUrl was used, this mock would be called. We verify it's NOT called.
      const scope = nock('https://www.etuovi.com')
        .get('/kohde/88888888')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({
          ...validCalculationInput,
          name: 'Investment with existing property',
          propertyId,
          etuoviUrl: 'https://www.etuovi.com/kohde/88888888',
        })
        .expect(201);

      expect(response.body.propertyId).toBe(propertyId);
      // Verify the etuovi fetch was NOT called
      expect(scope.isDone()).toBe(false);
    });
  });

  describe('GET /real-estate/investment', () => {
    it('requires authentication', async () => {
      await request(server)
        .get('/real-estate/investment')
        .expect(401);
    });

    it('returns only user investments', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investment for user1
      await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment' })
        .expect(201);

      // Create investment for user2
      await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token2))
        .send({ ...validCalculationInput, name: 'User2 Investment' })
        .expect(201);

      // Get user1 investments
      const response1 = await request(server)
        .get('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .expect(200);

      // Verify user1 only sees their own investments
      expect(Array.isArray(response1.body)).toBe(true);
      expect(response1.body.every((inv: Investment) => inv.userId === user1.user.id)).toBe(true);
      expect(response1.body.some((inv: Investment) => inv.name === 'User2 Investment')).toBe(false);
    });
  });

  describe('GET /real-estate/investment/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .get('/real-estate/investment/1')
        .expect(401);
    });

    it('returns investment when user owns it', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Create investment
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Test Investment' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Get investment
      const response = await request(server)
        .get(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(investmentId);
      expect(response.body.userId).toBe(user.user.id);
    });

    it('returns 404 when user does not own investment', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investment for user1
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Try to get it as user2
      await request(server)
        .get(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token2))
        .expect(404);
    });
  });

  describe('PUT /real-estate/investment/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .put('/real-estate/investment/1')
        .send(validCalculationInput)
        .expect(401);
    });

    it('updates investment when user owns it', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Create investment
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Original Name' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Update investment
      const response = await request(server)
        .put(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.id).toBe(investmentId);
    });

    it('returns 404 when user does not own investment', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investment for user1
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Try to update as user2
      await request(server)
        .put(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token2))
        .send({ ...validCalculationInput, name: 'Hacked Name' })
        .expect(404);
    });
  });

  describe('DELETE /real-estate/investment/:id', () => {
    it('requires authentication', async () => {
      await request(server)
        .delete('/real-estate/investment/1')
        .expect(401);
    });

    it('deletes investment when user owns it', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Create investment
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'To Delete' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Delete investment
      await request(server)
        .delete(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      // Verify it's deleted
      await request(server)
        .get(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns 404 when user does not own investment', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investment for user1
      const createResponse = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment' })
        .expect(201);

      const investmentId = createResponse.body.id;

      // Try to delete as user2
      await request(server)
        .delete(`/real-estate/investment/${investmentId}`)
        .set('Authorization', getBearerToken(token2))
        .expect(404);
    });
  });

  describe('POST /real-estate/investment/search', () => {
    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/investment/search')
        .send({})
        .expect(401);
    });

    it('returns only user investments', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investments
      await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment A', rentPerMonth: 1000 })
        .expect(201);

      await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token2))
        .send({ ...validCalculationInput, name: 'User2 Investment B', rentPerMonth: 1000 })
        .expect(201);

      // Search as user1
      const response = await request(server)
        .post('/real-estate/investment/search')
        .set('Authorization', getBearerToken(token1))
        .send({ where: { rentPerMonth: 1000 } })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((inv: Investment) => inv.userId === user1.user.id)).toBe(true);
      expect(response.body.some((inv: Investment) => inv.name === 'User2 Investment B')).toBe(false);
    });
  });

  describe('POST /real-estate/investment/delete', () => {
    it('requires authentication', async () => {
      await request(server)
        .post('/real-estate/investment/delete')
        .send({ ids: [1] })
        .expect(401);
    });

    it('deletes multiple investments when user owns them', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      // Create investments
      const create1 = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Bulk Delete 1' })
        .expect(201);

      const create2 = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token))
        .send({ ...validCalculationInput, name: 'Bulk Delete 2' })
        .expect(201);

      const ids = [create1.body.id, create2.body.id];

      // Bulk delete
      const response = await request(server)
        .post('/real-estate/investment/delete')
        .set('Authorization', getBearerToken(token))
        .send({ ids })
        .expect(200);

      expect(response.body.allSuccess).toBe(true);
      expect(response.body.rows.total).toBe(2);
      expect(response.body.rows.success).toBe(2);
      expect(response.body.rows.failed).toBe(0);

      // Verify they are deleted
      await request(server)
        .get(`/real-estate/investment/${ids[0]}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);

      await request(server)
        .get(`/real-estate/investment/${ids[1]}`)
        .set('Authorization', getBearerToken(token))
        .expect(404);
    });

    it('returns unauthorized for investments not owned by user', async () => {
      const user1 = testUsers.user1WithProperties;
      const user2 = testUsers.user2WithProperties;
      const token1 = await getUserAccessToken2(authService, user1.jwtUser);
      const token2 = await getUserAccessToken2(authService, user2.jwtUser);

      // Create investment for user1
      const create1 = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token1))
        .send({ ...validCalculationInput, name: 'User1 Investment' })
        .expect(201);

      // Create investment for user2
      const create2 = await request(server)
        .post('/real-estate/investment')
        .set('Authorization', getBearerToken(token2))
        .send({ ...validCalculationInput, name: 'User2 Investment' })
        .expect(201);

      // Try to bulk delete both as user1
      const response = await request(server)
        .post('/real-estate/investment/delete')
        .set('Authorization', getBearerToken(token1))
        .send({ ids: [create1.body.id, create2.body.id] })
        .expect(200);

      expect(response.body.allSuccess).toBe(false);
      expect(response.body.rows.total).toBe(2);
      expect(response.body.rows.success).toBe(1);
      expect(response.body.rows.failed).toBe(1);

      // User1's investment should be deleted
      await request(server)
        .get(`/real-estate/investment/${create1.body.id}`)
        .set('Authorization', getBearerToken(token1))
        .expect(404);

      // User2's investment should still exist
      await request(server)
        .get(`/real-estate/investment/${create2.body.id}`)
        .set('Authorization', getBearerToken(token2))
        .expect(200);
    });

    it('returns bad request when no ids provided', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);

      await request(server)
        .post('/real-estate/investment/delete')
        .set('Authorization', getBearerToken(token))
        .send({ ids: [] })
        .expect(400);
    });
  });
});
