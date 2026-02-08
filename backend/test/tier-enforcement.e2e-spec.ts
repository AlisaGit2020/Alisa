import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { UserService } from '@alisa-backend/people/user/user.service';
import { TierService } from '@alisa-backend/admin/tier.service';
import {
  addTier,
  getBearerToken,
  getUserAccessToken2,
  prepareDatabase,
} from './helper-functions';
import { JWTUser } from '@alisa-backend/auth/types';
import * as http from 'http';
import { User } from '@alisa-backend/people/user/entities/user.entity';

describe('Tier enforcement (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let userService: UserService;
  let tierService: TierService;

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
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

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
    await userService.add(jwtUser as Partial<User>);
    const users = await userService.search({ where: { email } });
    const user = users[0];
    jwtUser.id = user.id;

    await tierService.assignTierToUser(user.id, tierId);

    const token = await getUserAccessToken2(authService, jwtUser);
    return { user, token, jwtUser };
  };

  const createProperty = async (token: string, name: string) => {
    return request(server)
      .post('/real-estate/property')
      .set('Authorization', getBearerToken(token))
      .send({ name, size: 50 });
  };

  describe('Free tier (max 1 property)', () => {
    let freeTierId: number;

    beforeAll(async () => {
      await prepareDatabase(app);
      const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
      freeTierId = freeTier.id;
    });

    it('allows creating 1 property', async () => {
      const { token } = await createUserWithTier(
        'free-user@test.com',
        freeTierId,
      );

      const response = await createProperty(token, 'First Property');
      expect(response.status).toBe(201);
    });

    it('blocks creating a 2nd property', async () => {
      const { token, jwtUser } = await createUserWithTier(
        'free-user-2@test.com',
        freeTierId,
      );

      await createProperty(token, 'First Property');

      // Re-login to get updated token with ownership
      const newToken = await getUserAccessToken2(authService, jwtUser);

      const response = await createProperty(newToken, 'Second Property');
      expect(response.status).toBe(403);
    });
  });

  describe('Enterprise tier (unlimited)', () => {
    let enterpriseTierId: number;

    beforeAll(async () => {
      await prepareDatabase(app);
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
      const response1 = await createProperty(token, 'Property 1');
      expect(response1.status).toBe(201);

      // Re-login to get updated token
      const token2 = await getUserAccessToken2(authService, jwtUser);

      // Create second property
      const response2 = await createProperty(token2, 'Property 2');
      expect(response2.status).toBe(201);

      // Re-login and create third
      const token3 = await getUserAccessToken2(authService, jwtUser);
      const response3 = await createProperty(token3, 'Property 3');
      expect(response3.status).toBe(201);
    });
  });

  describe('Tier upgrade', () => {
    let freeTierId: number;
    let basicTierId: number;

    beforeAll(async () => {
      await prepareDatabase(app);
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
      await createProperty(token, 'First Property');

      // Re-login
      const token2 = await getUserAccessToken2(authService, jwtUser);

      // Try second property (should fail with Free tier)
      const response = await createProperty(token2, 'Second Property');
      expect(response.status).toBe(403);

      // Upgrade to Basic tier
      await tierService.assignTierToUser(user.id, basicTierId);

      // Re-login after upgrade
      const token3 = await getUserAccessToken2(authService, jwtUser);

      // Now second property should succeed
      const response2 = await createProperty(token3, 'Second Property');
      expect(response2.status).toBe(201);
    });
  });

  describe('Property deletion frees slot', () => {
    let freeTierId: number;

    beforeAll(async () => {
      await prepareDatabase(app);
      const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
      freeTierId = freeTier.id;
    });

    it('allows creating a new property after deleting one', async () => {
      const { token, jwtUser } = await createUserWithTier(
        'delete-user@test.com',
        freeTierId,
      );

      // Create first property
      const createResponse = await createProperty(token, 'First Property');
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
      const response = await createProperty(token3, 'Replacement Property');
      expect(response.status).toBe(201);
    });
  });

  describe('Existing property operations at limit', () => {
    let freeTierId: number;

    beforeAll(async () => {
      await prepareDatabase(app);
      const freeTier = await addTier(app, 'Free', 0, 1, true, 0);
      freeTierId = freeTier.id;
    });

    it('allows viewing and updating existing properties at the limit', async () => {
      const { token, jwtUser } = await createUserWithTier(
        'limit-user@test.com',
        freeTierId,
      );

      // Create a property (at limit now)
      const createResponse = await createProperty(token, 'My Property');
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
