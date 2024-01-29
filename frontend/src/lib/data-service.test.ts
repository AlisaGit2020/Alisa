// data-service.test.js
import DataService from "./data-service";
import AlisaContext from "../alisa-contexts/alisa-contexts";
import { TestInputDto } from "../../test/mock/TestInputDto";

jest.mock('../../src/constants', () => ({
    VITE_API_URL: 'http://localhost',
}));


describe('Data service', () => {
    
    let dataService: DataService<TestInputDto>;

    const context: AlisaContext = {
        apiPath: 'test/data',
        name: 'Test context',
        routePath: 'path/test/data'
    }
    
    beforeAll(() => {
       dataService = new DataService<TestInputDto>(context, {}, new TestInputDto())     
    })

    describe('Validation', () => {

        it('Transforms Validation array to string array', async () => {
            
            const strErrors = await dataService.getStrValidationErrors({
                name: ''                
            })         
            expect(strErrors).toHaveLength(1)    
            expect(strErrors[0]).toBe('name should not be empty')                    
        });
    })

});