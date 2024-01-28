// data-service.test.js
import DataService from "./data-service";
import AlisaContext from "../alisa-contexts/alisa-contexts";
import { TransactionInputDto } from "../../../backend/src/accounting/transaction/dtos/transaction-input.dto";
import { DTO } from "./types";

jest.mock('../../src/constants', () => ({
    VITE_API_URL: 'http://localhost',
}));


describe('Data service', () => {
    
    let dataService: DataService<DTO<TransactionInputDto>>;

    const context: AlisaContext = {
        apiPath: 'test/data',
        name: 'Test context',
        routePath: 'path/test/data'
    }
    
    beforeAll(() => {
       dataService = new DataService(context, {}, new TransactionInputDto())     
    })

    describe('Validation', () => {

        it('Transforms Validation array to string array', () => {
            
            const strErrors = dataService.getStrValidationErrors({
                totalAmount: 0,
                description: "",
                transactionDate: new Date('2024-01-01'),
                accountingDate: new Date('2024-01-01'),
                amount: 0,
                quantity: 0,
                id: 0
            })   
            
            expect(strErrors).toHaveLength(2)            
            expect(strErrors).toMatchObject(['name should not be empty', 'size should not be empty'])
        });
    })

});