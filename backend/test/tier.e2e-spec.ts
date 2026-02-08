import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { UserService } from '@alisa-backend/people/user/user.service';
import {
  addTier,
  closeAppGracefully,
  getBearerToken,
  getTestUsers,
  getUserAccessToken2,
  prepareDatabase,
  TestUsersSetup,
} from './helper-functions';
import { TierService } from '@alisa-backend/admin/tier.service';
import * as http from 'http';
import { UserInputDto } from '@alisa-backend/people/user/dtos/user-input.dto';

describe('Tier admin endpoints (e2e)', () => {
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
    await userService.update(adminUser.user.id, {
      ...adminUser.jwtUser,
      isAdmin: true,
    } as unknown as UserInputDto);
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
