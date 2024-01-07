/*
Data service teset
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { PropertyService } from 'src/real-estate/property/property.service';


describe('Expense service', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: PropertyService

  beforeAll(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource)
    service = app.get<PropertyService>(PropertyService);

  });

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    ['property'].map((tableName) => {
      dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
    });
  })

  it('adds new property', async () => {

    await service.add({
      name: 'Yrjöntie 1',
      size: 59.1
    });

    const property = await service.findOne(1);
    expect(property.id).toBe(1);
    expect(property.name).toBe('Yrjöntie 1');
    expect(property.size).toBe(59.1);

  })

  it('updates a property', async () => {

    await service.add({
      name: 'Yrjöntie 1',
      size: 59.1
    });

    await service.update(1, {
      name: 'Aurora',
      size: 36.5
    })
    const property = await service.findOne(1);
    expect(property.id).toBe(1);
    expect(property.name).toBe('Aurora');
    expect(property.size).toBe(36.5);

  })

});
