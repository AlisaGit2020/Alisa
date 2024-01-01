/*
End-to-end testing module
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { propertyTestData } from './data/real-estate/property';
import { TestData } from './data/test-data';

describe('PropertyController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const baseUrl = '/real-estate/property';
  const baseUrlWithId = `${baseUrl}/1`;
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

  describe.each([[propertyTestData]])('Entity test', (testData: TestData) => {

    it('adds a new item (POST)', () => {

      dataSource.query(`TRUNCATE TABLE ${testData.tableName} RESTART IDENTITY CASCADE;`);

      return request(app.getHttpServer())
        .post(testData.baseUrl)
        .send(testData.inputPost)
        .expect(201)
        .expect(testData.expected);
    });

    it('gets list of items (GET)', () => {
      return request(app.getHttpServer())
        .get(testData.baseUrl)
        .expect(200)
        .expect([testData.expected]);
    });

    it('gets single item (GET)', () => {
      return request(app.getHttpServer())
        .get(testData.baseUrlWithId)
        .expect(200)
        .expect(testData.expected);
    });

    it('does not update item properties when properties not given (PUT)', () => {
      //Set all values to undefined
      const copyObject = { ...testData.inputPost };
      for (const key in copyObject) {
        if (copyObject.hasOwnProperty(key)) {
          copyObject[key] = undefined;
        }
      }

      return request(app.getHttpServer())
        .put(testData.baseUrlWithId)
        .send(copyObject)
        .expect(200)
        .expect(testData.expected);
    });

    it('updates an item (PUT)', () => {

      return request(app.getHttpServer())
        .put(testData.baseUrlWithId)
        .send(testData.inputPut)
        .expect(200)
        .expect(testData.expectedPut);
    });

    it('deletes an item (DELETE)', () => {
      return request(app.getHttpServer())
        .delete(testData.baseUrlWithId)
        .expect(200)
        .expect('true');
    });
  })

});
