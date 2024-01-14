import { PropertyInputDto } from 'src/real-estate/property/dtos/property-input.dto';
import { Property } from 'src/real-estate/property/entities/property.entity';
import { TestData } from '../test-data';

export const propertyTestData = {
  name: 'Property',
  tables: ['property'],
  baseUrl: '/real-estate/property',
  baseUrlWithId: '/real-estate/property/1',

  inputPost: {
    name: 'Akun asunto',
    size: 36.5,
  } as PropertyInputDto,

  inputPut: {
    id: 1,
    name: 'Hessun asunto',
    size: 59,
  } as PropertyInputDto,

  expected: {
    id: 1,
    name: 'Akun asunto',
    size: 36.5,
  } as Property,

  expectedPut: {
    id: 1,
    name: 'Hessun asunto',
    size: 59,
  },
} as TestData;
