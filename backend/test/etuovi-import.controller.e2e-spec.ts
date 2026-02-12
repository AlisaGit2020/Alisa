import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { closeAppGracefully, prepareDatabase } from './helper-functions';
import * as http from 'http';
import * as nock from 'nock';
import * as fs from 'fs';
import * as path from 'path';
import { MOCKS_PATH } from '@alisa-backend/constants';

describe('EtuoviImportController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let mockHtml: string;

  beforeAll(async () => {
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
});
