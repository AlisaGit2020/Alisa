/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealEstateModule } from 'src/real-estate/real-estate.module';
import { DataSource } from 'typeorm';
import { before } from 'node:test';

describe('PropertyController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const tableName = 'property'
  
  const expectedProperty = {
    id: 1, 
    name: 'Akun asunto'
  }

  beforeEach(async () => {
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]      
    }).compile();
    
    app = moduleFixture.createNestApplication();    
    dataSource = app.get(DataSource);  

    await app.init();
  });

  it('/real-estate/property (POST)', () => {
      
    dataSource.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);          

    return request(app.getHttpServer())
      .post('/real-estate/property')
      .send({name: 'Akun asunto'})
      .expect(201)
      .expect(expectedProperty);
  });

  it('/real-estate/property get list', () => {          
    return request(app.getHttpServer())
      .get('/real-estate/property')      
      .expect(200)
      .expect([expectedProperty]);
  });

  it('/real-estate/property/$id (GET)', () => {          
    return request(app.getHttpServer())
      .get('/real-estate/property/1')      
      .expect(200)
      .expect(expectedProperty);
  });

  it('/real-estate/property/$id (PUT)', () => {          
    expectedProperty.name = 'Hessun asunto';

    return request(app.getHttpServer())
      .put('/real-estate/property/1')      
      .send({name: 'Hessun asunto'})
      .expect(200)
      .expect(expectedProperty);
  });

  it('/real-estate/property/$id (DELETE)', () => {          
    return request(app.getHttpServer())
      .delete('/real-estate/property/1')
      .expect(200)
      .expect('true');
  });

});
