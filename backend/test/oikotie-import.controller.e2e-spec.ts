import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  closeAppGracefully,
  prepareDatabase,
  getTestUsers,
  getUserAccessToken2,
  getBearerToken,
  TestUsersSetup,
  addTier,
} from './helper-functions';
import * as http from 'http';
import * as nock from 'nock';
import * as fs from 'fs';
import * as path from 'path';
import { MOCKS_PATH } from '@asset-backend/constants';
import { AuthService } from '@asset-backend/auth/auth.service';
import {
  PropertyExternalSource,
  PropertyStatus,
  PropertyType,
} from '@asset-backend/common/types';

describe('OikotieImportController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    server = app.getHttpServer();

    await prepareDatabase(app);

    // Load mock HTML
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'oikotie.property.html');
    mockHtml = fs.readFileSync(mockHtmlPath, 'utf-8');
  });

  afterAll(async () => {
    nock.cleanAll();
    nock.restore(); // Fully restore HTTP to prevent interference with other tests
    await closeAppGracefully(app, server);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /import/oikotie/fetch', () => {
    it('returns 400 for invalid URL format', async () => {
      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/123' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid Oikotie property listing URL',
      );
    });

    it('returns 400 for empty URL', async () => {
      await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: '' })
        .expect(400);
    });

    it('returns 400 for missing URL', async () => {
      await request(server).post('/import/oikotie/fetch').send({}).expect(400);
    });

    it('returns 400 for Oikotie URL without /myytavat-asunnot/ path', async () => {
      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://asunnot.oikotie.fi/vuokrattavat-asunnot/helsinki/12345' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid Oikotie property listing URL',
      );
    });

    it('fetches and parses property data successfully', async () => {
      // Mock the oikotie.fi response
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322524')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524' })
        .expect(200);

      expect(response.body.url).toBe('https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524');
      expect(response.body.debtFreePrice).toBe(125000);
      expect(response.body.apartmentSize).toBe(55.5);
      expect(response.body.maintenanceFee).toBe(180);
      expect(response.body.waterFee).toBe(25);
      expect(response.body.financingFee).toBe(75);
    });

    it('returns 404 when property listing not found', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/helsinki/nonexistent')
        .reply(404, 'Not Found');

      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/helsinki/nonexistent' })
        .expect(404);

      expect(response.body.message).toBe('Property listing not found');
    });

    it('returns 503 when access is blocked', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/helsinki/blocked')
        .reply(403, 'Forbidden');

      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/helsinki/blocked' })
        .expect(503);

      expect(response.body.message).toContain('blocked');
    });

    it('does not require authentication', async () => {
      // Mock the oikotie.fi response
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/turku/12345678')
        .reply(200, mockHtml);

      // Should work without any Authorization header
      await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/turku/12345678' })
        .expect(200);
    });

    it('handles URL with www prefix', async () => {
      nock('https://www.asunnot.oikotie.fi')
        .get('/myytavat-asunnot/espoo/withwww')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/fetch')
        .send({ url: 'https://www.asunnot.oikotie.fi/myytavat-asunnot/espoo/withwww' })
        .expect(200);

      expect(response.body.debtFreePrice).toBe(125000);
    });
  });

  describe('POST /import/oikotie/create-prospect', () => {
    let testUsers: TestUsersSetup;
    let authService: AuthService;
    let accessToken: string;

    beforeAll(async () => {
      await addTier(app, 'Free', 0, 100, true, 0);
      testUsers = await getTestUsers(app);
      authService = app.get<AuthService>(AuthService);
      accessToken = await getUserAccessToken2(
        authService,
        testUsers.user1WithProperties.jwtUser,
      );
    });

    it('returns 401 without authentication', async () => {
      await request(server)
        .post('/import/oikotie/create-prospect')
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524' })
        .expect(401);
    });

    it('returns 400 for invalid URL format', async () => {
      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/123' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid Oikotie property listing URL',
      );
    });

    it('returns 404 when property listing not found', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/helsinki/notfound')
        .reply(404, 'Not Found');

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/helsinki/notfound' })
        .expect(404);

      expect(response.body.message).toBe('Property listing not found');
    });

    it('creates a prospect property with status PROSPECT', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322524')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322524' })
        .expect(201);

      expect(response.body.status).toBe(PropertyStatus.PROSPECT);
    });

    it('sets externalSource to OIKOTIE', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322525')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322525' })
        .expect(201);

      expect(response.body.externalSource).toBe(PropertyExternalSource.OIKOTIE);
    });

    it('extracts externalSourceId from URL', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/helsinki/12345678')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/helsinki/12345678' })
        .expect(201);

      expect(response.body.externalSourceId).toBe('12345678');
    });

    it('sets name from Oikotie address', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322526')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322526' })
        .expect(201);

      // From mock HTML: "Vaasankatu 10 A 5, 65100 Vaasa"
      expect(response.body.name).toBe('Vaasankatu 10 A 5, 65100 Vaasa');
    });

    it('sets size from apartmentSize', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322527')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322527' })
        .expect(201);

      // From mock HTML: size 55.5
      expect(response.body.size).toBe(55.5);
    });

    it('sets buildYear from Oikotie data', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322528')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322528' })
        .expect(201);

      // From mock HTML: buildYear 1985
      expect(response.body.buildYear).toBe(1985);
    });

    it('sets apartmentType from propertyType', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322529')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322529' })
        .expect(201);

      // From mock HTML: buildingType "Kerrostalo" -> PropertyType.APARTMENT
      expect(response.body.apartmentType).toBe(PropertyType.APARTMENT);
    });

    it('parses address street correctly', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322530')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322530' })
        .expect(201);

      // From mock HTML: address.street = "Vaasankatu 10 A 5"
      expect(response.body.address).toBeDefined();
      expect(response.body.address.street).toBe('Vaasankatu 10 A 5');
    });

    it('parses address city correctly', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322531')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322531' })
        .expect(201);

      // From mock HTML: address.city = "Vaasa"
      expect(response.body.address).toBeDefined();
      expect(response.body.address.city).toBe('Vaasa');
    });

    it('parses address postalCode correctly', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322532')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322532' })
        .expect(201);

      // From mock HTML: address.postalCode = "65100"
      expect(response.body.address).toBeDefined();
      expect(response.body.address.postalCode).toBe('65100');
    });

    it('assigns property to authenticated user', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322533')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322533' })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.ownerships).toBeDefined();
      expect(response.body.ownerships.length).toBe(1);
      expect(response.body.ownerships[0].userId).toBe(
        testUsers.user1WithProperties.jwtUser.id,
      );
    });

    it('sets financial fields from Oikotie data', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322534')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322534' })
        .expect(201);

      // From mock HTML: price 125000, debtPrice 25000, maintenanceFee 180, financingFee 75, waterFee 25
      expect(response.body.purchasePrice).toBe(125000);
      expect(response.body.debtShare).toBe(25000);
      // Note: charges (maintenanceFee, financialCharge, waterCharge) are now stored in PropertyCharge table
    });

    it('updates existing property when user already has property with same Oikotie ID', async () => {
      const oikotieId = '99999999';

      // First request: create new property
      nock('https://asunnot.oikotie.fi')
        .get(`/myytavat-asunnot/vaasa/${oikotieId}`)
        .reply(200, mockHtml);

      const firstResponse = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: `https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/${oikotieId}` })
        .expect(201);

      const createdPropertyId = firstResponse.body.id;
      expect(createdPropertyId).toBeDefined();
      expect(firstResponse.body.externalSourceId).toBe(oikotieId);

      // Second request with same Oikotie ID: should update existing property
      nock('https://asunnot.oikotie.fi')
        .get(`/myytavat-asunnot/vaasa/${oikotieId}`)
        .reply(200, mockHtml);

      const secondResponse = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: `https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/${oikotieId}` })
        .expect(201);

      // Should return the same property id (updated, not created new)
      expect(secondResponse.body.id).toBe(createdPropertyId);
      expect(secondResponse.body.externalSourceId).toBe(oikotieId);
    });

    it('sets monthlyRent when provided', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322535')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({
          url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322535',
          monthlyRent: 850,
        })
        .expect(201);

      expect(response.body.monthlyRent).toBe(850);
    });

    it('does not set monthlyRent when not provided', async () => {
      nock('https://asunnot.oikotie.fi')
        .get('/myytavat-asunnot/vaasa/24322536')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/oikotie/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://asunnot.oikotie.fi/myytavat-asunnot/vaasa/24322536' })
        .expect(201);

      expect(response.body.monthlyRent).toBeNull();
    });
  });
});
