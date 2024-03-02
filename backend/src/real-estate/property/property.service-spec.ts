/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { PropertyService } from 'src/real-estate/property/property.service';
import { PropertyInputDto } from './dtos/property-input.dto';
import { UserService } from '@alisa-backend/people/user/user.service';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';

describe('Property service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: PropertyService;
  let userService: UserService;

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

  beforeEach(async () => {
    ['ownership', 'property', 'user'].map((tableName) => {
      dataSource.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
      );
    });
  });

  it('adds new property', async () => {
    const user = await userService.add({
      firstName: 'Test',
      lastName: 'Tester',
      email: 'test@email.com',
    });
    const inputProperty = new PropertyInputDto();
    inputProperty.name = 'Yrjöntie 1';
    inputProperty.size = 59.1;

    const ownership = new OwnershipInputDto();
    ownership.share = 50;
    ownership.userId = user.id;
    inputProperty.ownerships.push(ownership);

    await service.add(inputProperty);

    const properties = await service.search({
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
    expect(property.ownerships[0].userId).toBe(1);
    expect(property.ownerships[0].share).toBe(50);
  });

  it('updates a property', async () => {
    await service.add({
      name: 'Yrjöntie 1',
      size: 59.1,
    });

    await service.update(1, {
      name: 'Aurora',
      size: 36.5,
    });
    const property = await service.findOne(1);
    expect(property.id).toBe(1);
    expect(property.name).toBe('Aurora');
    expect(property.size).toBe(36.5);
  });
});
