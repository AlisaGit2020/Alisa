import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { closeAppGracefully, emptyTablesV2 } from './helper-functions';
import * as http from 'http';

describe('BetaController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await emptyTablesV2(app, ['beta_signup']);
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('POST /beta/signup', () => {
    it('creates a new beta signup (201)', async () => {
      const response = await request(server)
        .post('/beta/signup')
        .send({ email: 'test@example.com' })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Successfully signed up for beta.',
      });
    });

    it('returns 409 for duplicate email', async () => {
      await request(server)
        .post('/beta/signup')
        .send({ email: 'duplicate@example.com' })
        .expect(201);

      const response = await request(server)
        .post('/beta/signup')
        .send({ email: 'duplicate@example.com' })
        .expect(409);

      expect(response.body.message).toBe('This email is already registered.');
    });

    it('returns 400 for invalid email', async () => {
      await request(server)
        .post('/beta/signup')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('returns 400 for missing email', async () => {
      await request(server).post('/beta/signup').send({}).expect(400);
    });

    it('handles case-insensitive email (rejects uppercase duplicate)', async () => {
      await request(server)
        .post('/beta/signup')
        .send({ email: 'test@example.com' })
        .expect(201);

      await request(server)
        .post('/beta/signup')
        .send({ email: 'TEST@EXAMPLE.COM' })
        .expect(409);
    });

    it('handles case-insensitive email (lowercase version blocked after uppercase)', async () => {
      await request(server)
        .post('/beta/signup')
        .send({ email: 'UPPER@EXAMPLE.COM' })
        .expect(201);

      await request(server)
        .post('/beta/signup')
        .send({ email: 'upper@example.com' })
        .expect(409);
    });

    it('handles valid email formats', async () => {
      await request(server)
        .post('/beta/signup')
        .send({ email: 'valid.email+tag@example.com' })
        .expect(201);
    });
  });
});
