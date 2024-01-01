import { PropertyInputDto } from "src/real-estate/property/dtos/property-input.dto";
import { Property } from "src/real-estate/property/entities/property.entity";
import { TestData } from "../test-data";


export const propertyTestData = {
    tableName: 'property',
    baseUrl: '/real-estate/property',
    baseUrlWithId: '/real-estate/property/1',

    inputPost: {
        name: 'Akun asunto'
    } as PropertyInputDto,

    inputPut: {
        name: 'Hessun asunto'
    } as PropertyInputDto,

    expected: {
        id: 1,
        name: 'Akun asunto'
    } as Property,

    expectedPut: {
        id: 1,
        name: 'Hessun asunto'
    }
} as TestData