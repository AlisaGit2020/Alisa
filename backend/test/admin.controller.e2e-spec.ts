import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@asset-backend/auth/auth.service';
import { UserService } from '@asset-backend/people/user/user.service';
import { TierService } from '@asset-backend/admin/tier.service';
import {
  addTier,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import { UserInputDto } from '@asset-backend/people/user/dtos/user-input.dto';
import { JWTUser } from '@asset-backend/auth/types';
import { User } from '@asset-backend/people/user/entities/user.entity';
import * as http from 'http';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let authService: AuthService;
  let userService: UserService;
  let tierService: TierService;
  let testUsers: TestUsersSetup;
  let adminToken: string;
  let nonAdminToken: string;

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

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);

    // Set up admin user
    const adminUser = testUsers.user1WithProperties;
    await userService.setAdminStatus(adminUser.user.id, true);
    adminToken = await getUserAccessToken2(authService, {
      ...adminUser.jwtUser,
      isAdmin: true,
    });

    // Non-admin token
    nonAdminToken = await getUserAccessToken2(
      authService,
      testUsers.user2WithProperties.jwtUser,
    );
  });

  afterAll(async () => {
    await closeAppGracefully(app, server);
  });

  // Helper functions for tier enforcement tests
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

  const createProperty = async (token: string, name: string) => {
    return request(server)
      .post('/real-estate/property')
      .set('Authorization', getBearerToken(token))
      .send({ name, size: 50 });
  };

  describe('Admin User Management', () => {
    describe('GET /admin/users', () => {
      it('admin user can access and receive user list', async () => {
        const response = await request(server)
          .get('/admin/users')
          .set('Authorization', getBearerToken(adminToken))
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('firstName');
        expect(response.body[0]).toHaveProperty('lastName');
        expect(response.body[0]).toHaveProperty('email');
      });

      it('non-admin user gets 403', async () => {
        await request(server)
          .get('/admin/users')
          .set('Authorization', getBearerToken(nonAdminToken))
          .expect(403);
      });

      it('unauthenticated request gets 401', async () => {
        await request(server).get('/admin/users').expect(401);
      });

      it('invalid token gets 401', async () => {
        await request(server)
          .get('/admin/users')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });

  describe('Tier Admin Endpoints', () => {
    describe('GET /admin/tiers', () => {
      it('admin can list all tiers', async () => {
        await addTier(app, 'Test Tier', 9.99, 10, false, 0);

        const response = await request(server)
          .get('/admin/tiers')
          .set('Authorization', getBearerToken(adminToken))
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('price');
        expect(response.body[0]).toHaveProperty('maxProperties');
      });

      it('non-admin gets 403', async () => {
        await request(server)
          .get('/admin/tiers')
          .set('Authorization', getBearerToken(nonAdminToken))
          .expect(403);
      });

      it('unauthenticated gets 401', async () => {
        await request(server).get('/admin/tiers').expect(401);
      });
    });

    describe('GET /admin/tiers/:id', () => {
      it('admin can get a single tier by ID', async () => {
        const tier = await addTier(app, 'Single Tier', 12.99, 8, false, 50);

        const response = await request(server)
          .get(`/admin/tiers/${tier.id}`)
          .set('Authorization', getBearerToken(adminToken))
          .expect(200);

        expect(response.body).toHaveProperty('id', tier.id);
        expect(response.body).toHaveProperty('name', 'Single Tier');
        expect(Number(response.body.price)).toBe(12.99);
        expect(response.body).toHaveProperty('maxProperties', 8);
      });

      it('returns 404 for non-existent tier', async () => {
        await request(server)
          .get('/admin/tiers/99999')
          .set('Authorization', getBearerToken(adminToken))
          .expect(404);
      });

      it('non-admin gets 403', async () => {
        const tier = await addTier(app, 'Blocked Tier', 5.0, 3, false, 51);

        await request(server)
          .get(`/admin/tiers/${tier.id}`)
          .set('Authorization', getBearerToken(nonAdminToken))
          .expect(403);
      });

      it('unauthenticated gets 401', async () => {
        await request(server).get('/admin/tiers/1').expect(401);
      });
    });

    describe('POST /admin/tiers', () => {
      it('admin can create a tier', async () => {
        const response = await request(server)
          .post('/admin/tiers')
          .set('Authorization', getBearerToken(adminToken))
          .send({
            name: 'Premium',
            price: 19.99,
            maxProperties: 15,
            sortOrder: 5,
            isDefault: false,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Premium');
        expect(Number(response.body.price)).toBe(19.99);
        expect(response.body.maxProperties).toBe(15);
      });

      it('non-admin gets 403', async () => {
        await request(server)
          .post('/admin/tiers')
          .set('Authorization', getBearerToken(nonAdminToken))
          .send({
            name: 'Blocked',
            price: 0,
            maxProperties: 1,
          })
          .expect(403);
      });
    });

    describe('PUT /admin/tiers/:id', () => {
      it('admin can update a tier', async () => {
        const tier = await addTier(app, 'Updatable', 5.0, 3, false, 10);

        const response = await request(server)
          .put(`/admin/tiers/${tier.id}`)
          .set('Authorization', getBearerToken(adminToken))
          .send({
            name: 'Updated Tier',
            price: 7.99,
            maxProperties: 8,
            sortOrder: 10,
            isDefault: false,
          })
          .expect(200);

        expect(response.body.name).toBe('Updated Tier');
        expect(Number(response.body.price)).toBe(7.99);
      });

      it('returns 404 for non-existent tier', async () => {
        await request(server)
          .put('/admin/tiers/99999')
          .set('Authorization', getBearerToken(adminToken))
          .send({
            name: 'Ghost',
            price: 0,
            maxProperties: 1,
          })
          .expect(404);
      });
    });

    describe('DELETE /admin/tiers/:id', () => {
      it('admin can delete a tier without users', async () => {
        const tier = await addTier(app, 'Deletable', 1.0, 1, false, 20);

        await request(server)
          .delete(`/admin/tiers/${tier.id}`)
          .set('Authorization', getBearerToken(adminToken))
          .expect(200);
      });

      it('returns 400 when tier has assigned users', async () => {
        const tier = await addTier(app, 'InUse', 2.0, 2, false, 21);

        // Assign the tier to a user
        await tierService.assignTierToUser(
          testUsers.userWithoutProperties.user.id,
          tier.id,
        );

        await request(server)
          .delete(`/admin/tiers/${tier.id}`)
          .set('Authorization', getBearerToken(adminToken))
          .expect(400);

        // Cleanup: unassign tier by assigning a different one
        const otherTier = await addTier(app, 'Cleanup', 0, 1, false, 22);
        await tierService.assignTierToUser(
          testUsers.userWithoutProperties.user.id,
          otherTier.id,
        );
      });
    });

    describe('PUT /admin/users/:id/tier', () => {
      it('admin can assign tier to user', async () => {
        const tier = await addTier(app, 'Assignable', 3.0, 5, false, 30);

        await request(server)
          .put(`/admin/users/${testUsers.user2WithProperties.user.id}/tier`)
          .set('Authorization', getBearerToken(adminToken))
          .send({ tierId: tier.id })
          .expect(200);

        // Verify the user now has the tier
        const user = await userService.findOne(
          testUsers.user2WithProperties.user.id,
          { relations: ['tier'] },
        );
        expect(user.tierId).toBe(tier.id);
      });

      it('non-admin gets 403', async () => {
        const tier = await addTier(app, 'Blocked2', 0, 1, false, 31);

        await request(server)
          .put(`/admin/users/${testUsers.user2WithProperties.user.id}/tier`)
          .set('Authorization', getBearerToken(nonAdminToken))
          .send({ tierId: tier.id })
          .expect(403);
      });
    });
  });

  describe('Tier Enforcement', () => {
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
});
