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
} from './helper-functions';
import * as http from 'http';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

describe('Ownership via Property endpoints (e2e)', () => {
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
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  describe('Property ownership on creation', () => {
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

  describe('Property search with ownership', () => {
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

  describe('Property update with ownership', () => {
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
  });

  describe('Property access control', () => {
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

    it('returns 401 when not authenticated', async () => {
      await request(server)
        .post('/real-estate/property/search')
        .send({})
        .expect(401);
    });
  });

  describe('Property findOne with ownership', () => {
    it('returns property when user has ownership', async () => {
      const user = testUsers.user1WithProperties;
      const token = await getUserAccessToken2(authService, user.jwtUser);
      const property = user.properties[0];

      const response = await request(server)
        .get(`/real-estate/property/${property.id}`)
        .set('Authorization', getBearerToken(token))
        .expect(200);

      expect(response.body.id).toBe(property.id);
      // Property name may have been updated in previous tests
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
  });

  describe('Property deletion with ownership cascade', () => {
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
  });

  describe('User ownership isolation', () => {
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

});
