/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { PropertyService } from 'src/real-estate/property/property.service';
import { PropertyInputDto } from './dtos/property-input.dto';
import { UserService } from '@alisa-backend/people/user/user.service';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { jwtUser1, jwtUser2, jwtUser3 } from 'test/data/mocks/user.mock';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import {addProperty, emptyTables, sleep} from 'test/helper-functions';
import { propertyTestData } from 'test/data/real-estate/property.test.data';

describe('Property service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: PropertyService;
  let userService: UserService;
  let user2: User;
  let user3: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<PropertyService>(PropertyService);
    userService = app.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    await emptyTables(dataSource)

    await userService.add(jwtUser1);
    user2 = await userService.add(jwtUser2);
    user3 = await userService.add(jwtUser3);

    jwtUser2.id = user2.id;
    jwtUser3.id = user3.id;

    await addProperty(service, 'Yrjöntie 1', 59.1, jwtUser2);
    await addProperty(service, 'Annankatu 4', 34, jwtUser2);
    await addProperty(service, 'Bourbon street 4', 159, jwtUser3);
    await addProperty(service, 'Laamanninkuja 6', 51, jwtUser3);

    await sleep(50)
  });

  describe('Update', () => {
    it.each([[jwtUser1], [jwtUser3]])(
      'throws in update when not own property',
      async (jwtUser: JWTUser) => {
        try {
          await service.update(jwtUser, 1, {
            name: 'Aurora',
            size: 36.5,
          });
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      },
    );

    it('updates the property', async () => {
      await service.update(jwtUser2, 1, {
        name: 'Aurora',
        size: 36.5,
      });
      const property = await service.findOne(jwtUser2, 1);
      expect(property.id).toBe(1);
      expect(property.name).toBe('Aurora');
      expect(property.size).toBe(36.5);
    });
  });

  describe('Search', () => {
    it('does not return other user properties', async () => {
      const properties = await service.search(jwtUser1, {
        relations: { ownerships: true },
      });
      expect(properties.length).toBe(0);
    });

    it.each([[jwtUser1], [jwtUser2]])(
      'throws in search when not own property',
      async (jwtUser: JWTUser) => {
        try {
          await service.search(jwtUser, {
            where: {
              id: 3,
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

  describe('Delete', () => {
    it.each([[jwtUser1], [jwtUser3]])(
      'throws in delete when not own property',
      async (jwtUser: JWTUser) => {
        try {
          await service.delete(jwtUser, 1);
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      },
    );
  });

  describe('Add', () => {
    it('saved property and ownership correctly', async () => {
      const properties = await service.search(jwtUser2, {
        where: {
          id: 2,
        },
        relations: { ownerships: true },
      });

      const property = properties[0];

      expect(property.id).toBe(2);
      expect(property.name).toBe('Annankatu 4');
      expect(property.size).toBe(34);
      expect(property.ownerships[0].id).toBe(2);
      expect(property.ownerships[0].propertyId).toBe(2);
      expect(property.ownerships[0].userId).toBe(user2.id);
      expect(property.ownerships[0].share).toBe(100);
      expect(properties.length).toBe(1);
    });

    it('adds a ownership to user even not set with property', async () => {
      const propertyInput = propertyTestData.inputPost;
      propertyInput.ownerships = undefined;
      const insertedProperty = await service.add(jwtUser1, propertyInput);
      jwtUser1.ownershipInProperties = [insertedProperty.id];

      const properties = await service.search(jwtUser1, {
        where: {
          id: insertedProperty.id,
        },
        relations: { ownerships: true },
      });

      const property = properties[0];

      expect(property.ownerships[0].propertyId).toBe(insertedProperty.id);
      expect(property.ownerships[0].userId).toBe(jwtUser1.id);
      expect(property.ownerships[0].share).toBe(100);
    });
  });
});
