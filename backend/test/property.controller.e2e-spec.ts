/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { DataSource } from 'typeorm';
import { AuthService } from '@alisa-backend/auth/auth.service';
import {
  addProperty,
  getBearerToken,
  getUserAccessToken2,
} from './helper-functions';
import { jwtUser1, jwtUser2, jwtUser3 } from './data/mocks/user.mock';
import { UserService } from '@alisa-backend/people/user/user.service';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import { propertyTestData } from './data/real-estate/property.test.data';

describe('Property controller', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let user2: User;
  let user3: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    server = app.getHttpServer();

    const dataSource = app.get(DataSource);

    const userService = app.get(UserService);
    const propertyService = app.get(PropertyService);
    const authService = app.get(AuthService);

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

    //Create token before creating properties, so it tests also the ownership checks doesn't need relogin
    token = await getUserAccessToken2(authService, jwtUser2);

    await addProperty(propertyService, 'Yrjöntie 1', 59.1, jwtUser2);
    await addProperty(propertyService, 'Annankatu 4', 34, jwtUser2);
    await addProperty(propertyService, 'Bourbon street 4', 159, jwtUser3);
    await addProperty(propertyService, 'Laamanninkuja 6', 51, jwtUser3);
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe('Search', () => {
    it(`fails when not authorized`, async () => {
      await request(server).post(`/real-estate/property/search`).expect(401);
    });
    it(`returns user's properties`, async () => {
      const response = await request(server)
        .post(`/real-estate/property/search`)
        .set('Authorization', getBearerToken(token))
        .expect(200);
      expect(response.body.length).toBe(2);
    });
  });

  describe('Update', () => {
    it(`fails when not authorized`, async () => {
      await request(server).put(`/real-estate/property/1`).expect(401);
    });
    it(`updates the property`, async () => {
      await request(server)
        .put(`/real-estate/property/1`)
        .set('Authorization', getBearerToken(token))
        .send({ name: 'Changed name' })
        .expect(200);
    });
  });

  describe('Add', () => {
    it(`fails when not authorized`, async () => {
      await request(server).post(`/real-estate/property`).expect(401);
    });
    it(`updates the property`, async () => {
      await request(server)
        .post(`/real-estate/property`)
        .set('Authorization', getBearerToken(token))
        .send(propertyTestData.inputPost)
        .expect(201);
    });
  });

  describe('Get', () => {
    it(`fails when not authorized`, async () => {
      await request(server).get(`/real-estate/property/1`).expect(401);
    });
    it(`fails when not own property`, async () => {
      await request(server)
        .get(`/real-estate/property/3`)
        .set('Authorization', getBearerToken(token))
        .expect(401);
    });
    it(`gets the property`, async () => {
      await request(server)
        .get(`/real-estate/property/1`)
        .set('Authorization', getBearerToken(token))
        .expect(200);
    });
  });

  describe('Delete', () => {
    it(`fails when not authorized`, async () => {
      await request(server).delete(`/real-estate/property/1`).expect(401);
    });
    it(`fails when not own property`, async () => {
      await request(server)
        .delete(`/real-estate/property/3`)
        .set('Authorization', getBearerToken(token))
        .expect(401);
    });
    it(`success when own property`, async () => {
      await request(server)
        .delete(`/real-estate/property/1`)
        .set('Authorization', getBearerToken(token))
        .expect(200);
    });
  });
});
