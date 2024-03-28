/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { UserInputDto } from '@alisa-backend/people/user/dtos/user-input.dto';
import { UserService } from '@alisa-backend/people/user/user.service';
import { AuthService } from './auth.service';
import { sleep } from '../../test/helper-functions';

describe('User service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: AuthService;
  let userService: UserService;

  const testUser: UserInputDto = {
    email: 'test@email.com',
    firstName: 'Test',
    lastName: 'Tester',
    language: 'fi',
    photo: 'http:/localhost/photo1.png',
  };

  const updatedUser: UserInputDto = {
    email: 'test@email.com',
    firstName: 'New name',
    lastName: 'New lastname',
    language: 'en',
    photo: 'http:/localhost/photo2.png',
  };

  const secondUser: UserInputDto = {
    email: 'test2@email.com',
    firstName: 'Test2',
    lastName: 'Tester2',
    language: 'en',
    photo: 'http:/localhost/photo3.png',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    service = app.get<AuthService>(AuthService);
    userService = app.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ['user'].map(async (tableName) => {
      await dataSource.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
      );
    });
  });

  describe('login', () => {
    it('saves a new user to user table', async () => {
      await service.login(testUser);
      const savedUser = await userService.findOne(1);
      expect(savedUser).toMatchObject(testUser);
    });

    it('does not create a new row when re-login', async () => {
      await service.login(testUser);
      await sleep(50);
      await service.login(testUser);
      await sleep(50);
      const users = await userService.findAll();
      expect(users.length).toBe(1);
    });

    it('updates user when relogin', async () => {
      await service.login(testUser);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await service.login(updatedUser);

      const savedUser = await userService.findOne(1);
      expect(savedUser).toMatchObject(updatedUser);
    });

    it('creates a new user when a new user login', async () => {
      await service.login(testUser);
      await service.login(secondUser);
      const users = await userService.findAll();
      expect(users.length).toBe(2);
    });
  });
});
