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
    ['expense', 'income', 'ownership', 'property', 'user'].map(
      async (tableName) => {
        await dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      },
    );

    await userService.add(jwtUser1);
    user2 = await userService.add(jwtUser2);
    user3 = await userService.add(jwtUser3);

    jwtUser2.id = user2.id;
    jwtUser3.id = user3.id;

    await addProperty('Yrjöntie 1', 59.1, jwtUser2);
    await addProperty('Annankatu 4', 34, jwtUser2);
    await addProperty('Bourbon street 4', 159, jwtUser3);
    await addProperty('Laamanninkuja 6', 51, jwtUser3);
  });

  const addProperty = async (name: string, size: number, user: JWTUser) => {
    const inputProperty = new PropertyInputDto();
    inputProperty.name = name;
    inputProperty.size = size;

    const ownership = new OwnershipInputDto();
    ownership.share = 100;
    inputProperty.ownerships.push(ownership);

    await service.add(user, inputProperty);
  };

  it('saved property and ownership correctly', async () => {
    const properties = await service.search(jwtUser2, {
      where: {
        id: 1,
      },
      relations: { ownerships: true },
    });

    const property = properties[0];

    expect(property.id).toBe(1);
    expect(property.name).toBe('Yrjöntie 1');
    expect(property.size).toBe(59.1);
    expect(property.ownerships[0].id).toBe(1);
    expect(property.ownerships[0].propertyId).toBe(1);
    expect(property.ownerships[0].userId).toBe(user2.id);
    expect(property.ownerships[0].share).toBe(100);
    expect(properties.length).toBe(1);
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
      const property = await service.findOne(1);
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
});
