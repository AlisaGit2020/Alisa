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
} from '@asset-backend/common/types';

describe('EtuoviImportController (e2e)', () => {
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
    const mockHtmlPath = path.join(MOCKS_PATH, 'import', 'etuovi.property.html');
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

  describe('POST /import/etuovi/fetch', () => {
    it('returns 400 for invalid URL format', async () => {
      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://oikotie.fi/kohde/123' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid etuovi.com property listing URL',
      );
    });

    it('returns 400 for empty URL', async () => {
      await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: '' })
        .expect(400);
    });

    it('returns 400 for missing URL', async () => {
      await request(server).post('/import/etuovi/fetch').send({}).expect(400);
    });

    it('returns 400 for etuovi URL without kohde path', async () => {
      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/myytavat-asunnot' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid etuovi.com property listing URL',
      );
    });

    it('fetches and parses property data successfully', async () => {
      // Mock the etuovi.com response
      nock('https://www.etuovi.com')
        .get('/kohde/80481676')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/80481676' })
        .expect(200);

      expect(response.body.url).toBe('https://www.etuovi.com/kohde/80481676');
      expect(response.body.deptFreePrice).toBe(125000);
      expect(response.body.apartmentSize).toBe(55.5);
      expect(response.body.maintenanceFee).toBe(180);
      expect(response.body.waterCharge).toBe(25);
      expect(response.body.chargeForFinancialCosts).toBe(75);
    });

    it('returns 404 when property listing not found', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/nonexistent')
        .reply(404, 'Not Found');

      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/nonexistent' })
        .expect(404);

      expect(response.body.message).toBe('Property listing not found');
    });

    it('returns 503 when access is blocked', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/blocked')
        .reply(403, 'Forbidden');

      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/blocked' })
        .expect(503);

      expect(response.body.message).toContain('blocked');
    });

    it('does not require authentication', async () => {
      // Mock the etuovi.com response
      nock('https://www.etuovi.com')
        .get('/kohde/12345678')
        .reply(200, mockHtml);

      // Should work without any Authorization header
      await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/12345678' })
        .expect(200);
    });

    it('handles URL with www prefix', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/withwww')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/fetch')
        .send({ url: 'https://www.etuovi.com/kohde/withwww' })
        .expect(200);

      expect(response.body.deptFreePrice).toBe(125000);
    });
  });

  describe('POST /import/etuovi/create-prospect', () => {
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
        .post('/import/etuovi/create-prospect')
        .send({ url: 'https://www.etuovi.com/kohde/12345' })
        .expect(401);
    });

    it('returns 400 for invalid URL format', async () => {
      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://oikotie.fi/kohde/123' })
        .expect(400);

      expect(response.body.message).toContain(
        'URL must be a valid etuovi.com property listing URL',
      );
    });

    it('returns 404 when property listing not found', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/notfound')
        .reply(404, 'Not Found');

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/notfound' })
        .expect(404);

      expect(response.body.message).toBe('Property listing not found');
    });

    it('creates a prospect property with status PROSPECT', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481676')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481676' })
        .expect(201);

      expect(response.body.status).toBe(PropertyStatus.PROSPECT);
    });

    it('sets externalSource to ETUOVI', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481677')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481677' })
        .expect(201);

      expect(response.body.externalSource).toBe(PropertyExternalSource.ETUOVI);
    });

    it('extracts externalSourceId from URL', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/12345678')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/12345678' })
        .expect(201);

      expect(response.body.externalSourceId).toBe('12345678');
    });

    it('sets name from etuovi address', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481679')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481679' })
        .expect(201);

      // From mock HTML: "Laihiantie 10 A 5 - 2h + k + kph"
      expect(response.body.name).toBe('Laihiantie 10 A 5 - 2h + k + kph');
    });

    it('sets size from apartmentSize', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481680')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481680' })
        .expect(201);

      // From mock HTML: livingArea 55.5
      expect(response.body.size).toBe(55.5);
    });

    it('sets buildYear from etuovi data', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481681')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481681' })
        .expect(201);

      // From mock HTML: buildingYear 1985
      expect(response.body.buildYear).toBe(1985);
    });

    it('sets apartmentType from propertyType', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481682')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481682' })
        .expect(201);

      // From mock HTML: residentialPropertyType APARTMENT_HOUSE -> Kerrostalo
      expect(response.body.apartmentType).toBe('Kerrostalo');
    });

    it('parses address street correctly', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481683')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481683' })
        .expect(201);

      // From mock HTML: "Laihiantie 10 A 5 - 2h + k + kph", street is the part before " - "
      expect(response.body.address).toBeDefined();
      expect(response.body.address.street).toBe('Laihiantie 10 A 5');
    });

    it('parses address city from municipality.defaultName', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481685')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481685' })
        .expect(201);

      // From mock HTML: municipality.defaultName = "Laihia"
      expect(response.body.address).toBeDefined();
      expect(response.body.address.city).toBe('Laihia');
    });

    it('parses address postalCode from location.postCode', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481686')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481686' })
        .expect(201);

      // From mock HTML: location.postCode = "66400"
      expect(response.body.address).toBeDefined();
      expect(response.body.address.postalCode).toBe('66400');
    });

    it('assigns property to authenticated user', async () => {
      nock('https://www.etuovi.com')
        .get('/kohde/80481684')
        .reply(200, mockHtml);

      const response = await request(server)
        .post('/import/etuovi/create-prospect')
        .set('Authorization', getBearerToken(accessToken))
        .send({ url: 'https://www.etuovi.com/kohde/80481684' })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.ownerships).toBeDefined();
      expect(response.body.ownerships.length).toBe(1);
      expect(response.body.ownerships[0].userId).toBe(
        testUsers.user1WithProperties.jwtUser.id,
      );
    });
  });
});
