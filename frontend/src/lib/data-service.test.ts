// data-service.test.js
import DataService from "./data-service";
import AlisaContext from "../alisa-contexts/alisa-contexts";
import { TestInputDto } from "../../test/mock/TestInputDto";
import { TestNestedInputDto } from "../../test/mock/TestNestedInputDto";
import "reflect-metadata";

jest.mock('../../src/constants', () => ({
    VITE_API_URL: 'http://localhost',
}));


describe('Data service', () => {
    
    let dataService: DataService<object>;

    const context: AlisaContext = {
        apiPath: 'test/data',
        name: 'Test context',
        routePath: 'path/test/data'
    }    

    describe('Validation', () => {

        it('Transforms validation array to string array', async () => {
            dataService = new DataService<TestInputDto>(context, {}, new TestInputDto())   

            const strErrors = await dataService.getStrValidationErrors({
                name: ''                
            })         
            expect(strErrors).toHaveLength(1)    
            expect(strErrors[0]).toBe('name should not be empty')                    
        });

        it('validated child input dto', async () => {
            dataService = new DataService<TestNestedInputDto>(context, {}, new TestNestedInputDto())   
            
            const strErrors = await dataService.getStrValidationErrors({
                name: 'Some name',
                child: {
                    name: ''
                }
            })         
            expect(strErrors).toHaveLength(1)    
            expect(strErrors[0]).toBe('child name should not be empty')                    
        });
    })

    describe('Data', () => {

        it('updates nested data correctly', async () => {
            const dataService = new DataService<{
                description: string, 
                transaction: {                    
                    totalAmount: number,
                    isDefault: boolean,
                    thirdLevel: {
                        someField: string
                    }
                },
            }>(context)
            const data = {
                description: 'First version',
                transaction: {
                    totalAmount: 9.9,
                    isDefault: false,
                    thirdLevel: {
                        someField: 'some text'
                    }
                }
            }   
            
            let updatedData = dataService.updateNestedData(data, 'transaction.totalAmount', 10)         
            updatedData = dataService.updateNestedData(updatedData, 'transaction.isDefault', true)         
            updatedData = dataService.updateNestedData(updatedData, 'description', 'Second version')         
            updatedData = dataService.updateNestedData(updatedData, 'transaction.thirdLevel.someField', 'Another value')        

            expect (updatedData.transaction.totalAmount).toBe(10)
            expect (updatedData.transaction.isDefault).toBe(true)
            expect (updatedData.description).toBe('Second version')
            expect (updatedData.transaction.thirdLevel.someField).toBe('Another value')
            
        });
    })

});