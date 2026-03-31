import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { Property } from '../src/real-estate/property/entities/property.entity';
import { PropertyCharge } from '../src/real-estate/property/entities/property-charge.entity';
import { Ownership } from '../src/people/ownership/entities/ownership.entity';
import { User } from '../src/people/user/entities/user.entity';
import { ChargeType, PropertyStatus } from '../src/common/types';
import {
  createTestProperty,
  createTestUser,
  getAuthToken,
  cleanupTestData,
} from './helper-functions';

describe('PropertyChargeController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let propertyRepository: Repository<Property>;
  let chargeRepository: Repository<PropertyCharge>;
  let ownershipRepository: Repository<Ownership>;
  let userRepository: Repository<User>;

  let testUser: User;
  let testUser2: User;
  let testProperty: Property;
  let testProperty2: Property;
  let authToken: string;
  let authToken2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    propertyRepository = dataSource.getRepository(Property);
    chargeRepository = dataSource.getRepository(PropertyCharge);
    ownershipRepository = dataSource.getRepository(Ownership);
    userRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData(dataSource, 'property-charge-e2e');

    // Create test users
    testUser = await createTestUser(userRepository, {
      email: 'property-charge-e2e-user1@test.com',
      firstName: 'Test',
      lastName: 'User1',
    });
    testUser2 = await createTestUser(userRepository, {
      email: 'property-charge-e2e-user2@test.com',
      firstName: 'Test',
      lastName: 'User2',
    });

    // Create test properties
    testProperty = await createTestProperty(
      propertyRepository,
      ownershipRepository,
      testUser,
      { name: 'Charge Test Property 1', status: PropertyStatus.OWN },
    );
    testProperty2 = await createTestProperty(
      propertyRepository,
      ownershipRepository,
      testUser2,
      { name: 'Charge Test Property 2', status: PropertyStatus.OWN },
    );

    // Get auth tokens
    authToken = await getAuthToken(app, testUser);
    authToken2 = await getAuthToken(app, testUser2);
  });

  afterAll(async () => {
    await cleanupTestData(dataSource, 'property-charge-e2e');
    await app.close();
  });

  describe('POST /real-estate/property/:id/charges', () => {
    it('should create a charge (201)', async () => {
      const chargeInput = {
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 150,
        startDate: '2025-01-01',
        endDate: null,
      };

      const response = await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(chargeInput)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.chargeType).toBe(ChargeType.MAINTENANCE_FEE);
      expect(response.body.amount).toBe(150);
      expect(response.body.propertyId).toBe(testProperty.id);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(401);
    });

    it('should return 403 when creating charge for another user property', async () => {
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty2.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(403);
    });

    it('should return 404 for non-existent property', async () => {
      await request(app.getHttpServer())
        .post('/real-estate/property/99999/charges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(404);
    });

    it('should auto-close previous open charge when creating new one', async () => {
      // Create first charge
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
          endDate: null,
        })
        .expect(201);

      // Create second charge with new start date
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: '2025-07-01',
          endDate: null,
        })
        .expect(201);

      // Get all charges and verify first one was closed
      const response = await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const charges = response.body;
      const oldCharge = charges.find((c: PropertyCharge) => c.amount === 100);
      expect(oldCharge.endDate).toBe('2025-06-30');
    });
  });

  describe('GET /real-estate/property/:id/charges', () => {
    beforeEach(async () => {
      // Create some test charges
      await chargeRepository.save([
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: new Date('2025-01-01'),
          endDate: null,
        },
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: new Date('2025-01-01'),
          endDate: null,
        },
      ]);
    });

    it('should return all charges (200)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty.id}/charges`)
        .expect(401);
    });

    it('should return 403 for another user property', async () => {
      await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty2.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('GET /real-estate/property/:id/charges/current', () => {
    beforeEach(async () => {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      await chargeRepository.save([
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          startDate: lastMonth,
          endDate: null,
        },
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: lastMonth,
          endDate: null,
        },
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: 25,
          startDate: lastMonth,
          endDate: null,
        },
        {
          propertyId: testProperty.id,
          chargeType: ChargeType.TOTAL_CHARGE,
          amount: 225,
          startDate: lastMonth,
          endDate: null,
        },
      ]);
    });

    it('should return current charges (200)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty.id}/charges/current`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.maintenanceFee).toBe(150);
      expect(response.body.financialCharge).toBe(50);
      expect(response.body.waterPrepayment).toBe(25);
      expect(response.body.totalCharge).toBe(225);
    });

    it('should return null for missing charge types', async () => {
      // Create a new property without charges
      const emptyProperty = await createTestProperty(
        propertyRepository,
        ownershipRepository,
        testUser,
        { name: 'Empty Charges Property', status: PropertyStatus.OWN },
      );

      const response = await request(app.getHttpServer())
        .get(`/real-estate/property/${emptyProperty.id}/charges/current`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.maintenanceFee).toBeNull();
      expect(response.body.financialCharge).toBeNull();
      expect(response.body.waterPrepayment).toBeNull();
      expect(response.body.totalCharge).toBeNull();
    });
  });

  describe('PUT /real-estate/property/:id/charges/:chargeId', () => {
    let testCharge: PropertyCharge;

    beforeEach(async () => {
      testCharge = await chargeRepository.save({
        propertyId: testProperty.id,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 100,
        startDate: new Date('2025-01-01'),
        endDate: null,
      });
    });

    it('should update charge (200)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/real-estate/property/${testProperty.id}/charges/${testCharge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 150,
          endDate: '2025-12-31',
        })
        .expect(200);

      expect(response.body.amount).toBe(150);
      expect(response.body.endDate).toBe('2025-12-31');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .put(`/real-estate/property/${testProperty.id}/charges/${testCharge.id}`)
        .send({ amount: 150 })
        .expect(401);
    });

    it('should return 403 for another user property charge', async () => {
      const otherCharge = await chargeRepository.save({
        propertyId: testProperty2.id,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 100,
        startDate: new Date('2025-01-01'),
        endDate: null,
      });

      await request(app.getHttpServer())
        .put(`/real-estate/property/${testProperty2.id}/charges/${otherCharge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 150 })
        .expect(403);
    });

    it('should return 404 for non-existent charge', async () => {
      await request(app.getHttpServer())
        .put(`/real-estate/property/${testProperty.id}/charges/99999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 150 })
        .expect(404);
    });
  });

  describe('DELETE /real-estate/property/:id/charges/:chargeId', () => {
    let testCharge: PropertyCharge;

    beforeEach(async () => {
      testCharge = await chargeRepository.save({
        propertyId: testProperty.id,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 100,
        startDate: new Date('2025-01-01'),
        endDate: null,
      });
    });

    it('should delete charge (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/real-estate/property/${testProperty.id}/charges/${testCharge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify charge is deleted
      const deleted = await chargeRepository.findOneBy({ id: testCharge.id });
      expect(deleted).toBeNull();
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .delete(`/real-estate/property/${testProperty.id}/charges/${testCharge.id}`)
        .expect(401);
    });

    it('should return 403 for another user property charge', async () => {
      const otherCharge = await chargeRepository.save({
        propertyId: testProperty2.id,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 100,
        startDate: new Date('2025-01-01'),
        endDate: null,
      });

      await request(app.getHttpServer())
        .delete(`/real-estate/property/${testProperty2.id}/charges/${otherCharge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent charge', async () => {
      await request(app.getHttpServer())
        .delete(`/real-estate/property/${testProperty.id}/charges/99999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('TOTAL_CHARGE auto-calculation', () => {
    it('should auto-calculate total when creating charges', async () => {
      // Create maintenance fee
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 100,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Create financial charge
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Create water prepayment
      await request(app.getHttpServer())
        .post(`/real-estate/property/${testProperty.id}/charges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: 25,
          startDate: '2025-01-01',
        })
        .expect(201);

      // Get current charges and verify total
      const response = await request(app.getHttpServer())
        .get(`/real-estate/property/${testProperty.id}/charges/current`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalCharge).toBe(175); // 100 + 50 + 25
    });
  });
});