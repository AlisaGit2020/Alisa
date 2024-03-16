/*
Data service test
*/
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PropertyService } from 'src/real-estate/property/property.service';

import {
  addProperty,
  getTestUsers,
  prepareDatabase,
  TestUser,
  TestUsersSetup,
} from 'test/helper-functions';
import { propertyTestData } from 'test/data/real-estate/property.test.data';

describe('Property service', () => {
  let app: INestApplication;

  let service: PropertyService;
  let testUsers: TestUsersSetup;
  let mainTestUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = app.get<PropertyService>(PropertyService);

    await prepareDatabase(app);
    testUsers = await getTestUsers(app);
    mainTestUser = testUsers.user1WithProperties;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create', () => {
    it('saved property and ownership correctly', async () => {
      const properties = await service.search(mainTestUser.jwtUser, {
        where: {
          id: 2,
        },
        relations: { ownerships: true },
      });

      const property = properties[0];

      expect(property.id).toBe(2);
      expect(property.name).toBe(`User's 1 second property`);
      expect(property.size).toBe(59);
      expect(property.ownerships[0].id).toBe(2);
      expect(property.ownerships[0].propertyId).toBe(2);
      expect(property.ownerships[0].userId).toBe(mainTestUser.user.id);
      expect(property.ownerships[0].share).toBe(100);
      expect(properties.length).toBe(1);
    });

    it('adds a ownership to user even not set with property', async () => {
      const propertyInput = propertyTestData.inputPost;
      propertyInput.ownerships = undefined;
      const insertedProperty = await service.add(
        mainTestUser.jwtUser,
        propertyInput,
      );
      mainTestUser.jwtUser.ownershipInProperties = [insertedProperty.id];

      const properties = await service.search(mainTestUser.jwtUser, {
        where: {
          id: insertedProperty.id,
        },
        relations: { ownerships: true },
      });

      const property = properties[0];

      expect(property.ownerships[0].propertyId).toBe(insertedProperty.id);
      expect(property.ownerships[0].userId).toBe(mainTestUser.jwtUser.id);
      expect(property.ownerships[0].share).toBe(100);
    });
  });

  describe('Read', () => {
    it('returns own property', async () => {
      const property = await service.findOne(mainTestUser.jwtUser, 2);
      expect(property.id).toBe(2);
      expect(property.name).toBe(`User's 1 second property`);
      expect(property.size).toBe(59);
    });

    it('returns null when property not exist', async () => {
      const property = await service.findOne(mainTestUser.jwtUser, 999);
      expect(property).toBeNull();
    });

    it('throws UnauthorizedException when not own property', async () => {
      await expect(
        service.delete(testUsers.userWithoutProperties.jwtUser, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update', () => {
    it('updates the property', async () => {
      await service.update(mainTestUser.jwtUser, 1, {
        name: 'Aurora',
        size: 36.5,
      });
      const property = await service.findOne(mainTestUser.jwtUser, 1);
      expect(property.id).toBe(1);
      expect(property.name).toBe('Aurora');
      expect(property.size).toBe(36.5);
    });

    it('throws not found when property does not exist', async () => {
      await expect(
        service.update(mainTestUser.jwtUser, 999, {
          name: 'Aurora',
          size: 36.5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([['user2WithProperties'], ['userWithoutProperties']])(
      'throws in update when not own property',
      async (user: keyof TestUsersSetup) => {
        try {
          await service.update(testUsers[user].jwtUser, 1, {
            name: 'Aurora',
            size: 36.5,
          });
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      },
    );
  });

  describe('Delete', () => {
    it('deletes the property', async () => {
      const savedProperty = await addProperty(
        service,
        'Aurora',
        36.5,
        mainTestUser.jwtUser,
      );
      await service.delete(mainTestUser.jwtUser, savedProperty.id);
      const property = await service.findOne(
        mainTestUser.jwtUser,
        savedProperty.id,
      );
      expect(property).toBeNull();
    });

    it('throws not found when property does not exist', async () => {
      await expect(service.delete(mainTestUser.jwtUser, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it.each([['user2WithProperties'], ['userWithoutProperties']])(
      'throws in delete when not own property',
      async (user: keyof TestUsersSetup) => {
        try {
          await service.delete(testUsers[user].jwtUser, 1);
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      },
    );
  });

  describe('Search', () => {
    it('does not return other user properties', async () => {
      const properties = await service.search(
        testUsers.userWithoutProperties.jwtUser,
        {
          relations: { ownerships: true },
        },
      );
      expect(properties.length).toBe(0);
    });

    it.each([['user2WithProperties'], ['userWithoutProperties']])(
      'throws in search when not own property',
      async (user: keyof TestUsersSetup) => {
        try {
          await service.search(testUsers[user].jwtUser, {
            where: {
              id: 1,
            },
            relations: { ownerships: true },
          });
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      },
    );
  });
});
