
import DataService from "./data-service";
import AlisaContext from "@alisa-lib/alisa-contexts";
import { TestInputDto } from "../../test/mocks/TestInputDto";
import { TestNestedInputDto } from "../../test/mocks/TestNestedInputDto";
import "reflect-metadata";
import ApiClient from "./api-client";

// Constants are mocked via jest.config.js moduleNameMapper

describe('Data service', () => {

    let dataService: DataService<object>;

    const context: AlisaContext = {
        apiPath: 'test/data',
        name: 'Test context',
        routePath: 'path/test/data'
    }

    describe('Validation', () => {

        it('Transforms validation array to string array', async () => {
            dataService = new DataService<TestInputDto>({ context, dataValidateInstance: new TestInputDto() })

            const strErrors = await dataService.getStrValidationErrors({
                name: ''
            })
            expect(strErrors).toHaveLength(1)
            expect(strErrors[0]).toBe('name should not be empty')
        });

        it('validated child input dto', async () => {
            dataService = new DataService<TestNestedInputDto>({ context, dataValidateInstance: new TestNestedInputDto() })

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
            }>({ context })
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

            expect(updatedData.transaction.totalAmount).toBe(10)
            expect(updatedData.transaction.isDefault).toBe(true)
            expect(updatedData.description).toBe('Second version')
            expect(updatedData.transaction.thirdLevel.someField).toBe('Another value')

        });
    })

    describe('Read', () => {
        it('should read data successfully', async () => {
            // Oletetaan, että ApiClient-mokkia käytetään testissä.
            const apiClientMock = jest.spyOn(ApiClient, 'get');
            const responseData = { id: 1, name: 'Test Data' };
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AlisaContext;
            const dataService = new DataService<{ transaction: { totalAmount: number } }>({ context, relations: { transaction: true } });

            // Kutsu read-funktiota
            const result = await dataService.read(1);

            // Tarkista, että ApiClient.get kutsuttiin oikein
            expect(apiClientMock).toHaveBeenCalledWith('/test', 1, { transaction: true });

            // Tarkista, että paluuarvo vastaa odotuksia
            expect(result).toEqual(responseData);
        });
    })

    describe('Save', () => {
        it('should save data successfully when validation passes', async () => {

            const apiClientPostMock = jest.spyOn(ApiClient, 'post');
            apiClientPostMock.mockResolvedValueOnce({ id: 1, name: 'Test Data' });

            const apiClientPutMock = jest.spyOn(ApiClient, 'put');
            apiClientPutMock.mockResolvedValueOnce({ id: 1, name: 'Test Data' });

            const context = { apiPath: '/test' } as AlisaContext;
            const dataService = new DataService({ context });

            //Post
            const validData = { name: 'Test Data' };
            let result = await dataService.save(validData);

            expect(apiClientPostMock).toHaveBeenCalledWith('/test', validData);
            expect(result).toEqual({ id: 1, name: 'Test Data' });

            //Put
            result = await dataService.save(validData, 1);

            expect(apiClientPutMock).toHaveBeenCalledWith('/test', 1, validData);
            expect(result).toEqual({ id: 1, name: 'Test Data' });
        });

        it('should return validation errors when validation fails', async () => {
            const invalidData = { name: '' };

            const context = { apiPath: '/test' } as AlisaContext;
            const dataService = new DataService<TestInputDto>({ context, dataValidateInstance: new TestInputDto() });

            const result = await dataService.save(invalidData);

            if (Array.isArray(result)) {
                expect(result).toHaveLength(1);
                expect(result[0].property).toBe('name');
                expect(result[0].constraints).toHaveProperty('isNotEmpty');
            } else {
                expect(result).toBeInstanceOf(TestInputDto);
            }
        });
    });

    describe('Delete', () => {
        it('deletes data successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'delete');
            apiClientMock.mockResolvedValueOnce(undefined);

            const context = { apiPath: '/test' } as AlisaContext;
            const dataService = new DataService<{ transaction: { totalAmount: number } }>({ context, relations: { transaction: true } });

            await dataService.delete(1);
            expect(apiClientMock).toHaveBeenCalledWith('/test', 1);

        }, 10000);
    })

    describe('Search', () => {
        it('should read data successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'search');
            const responseData = [{ id: 1, name: 'Test Data' }];
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AlisaContext;
            const fetchOptions = {
                relations: {
                    transaction: true
                },
                where: {
                    id: 1
                }
            }

            const dataService = new DataService<{
                id: number,
                name: number,
                transaction: {
                    totalAmount: number
                }
            }>({
                context,
                fetchOptions
            });


            // Kutsu read-funktiota
            const result = await dataService.search();

            // Tarkista, että ApiClient.get kutsuttiin oikein
            expect(apiClientMock).toHaveBeenCalledWith('/test', fetchOptions);

            // Tarkista, että paluuarvo vastaa odotuksia
            expect(result).toEqual(responseData);
        });
    })

    describe('Statistics', () => {
        it('should read data successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'statistics');
            const responseData = [{ rowCount: 11, total: 206 }];
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AlisaContext;
            const fetchOptions = {
                where: {
                    dateCreated: new Date('2024-01-01'),                    
                }
            }

            const dataService = new DataService<{
                id: number,
                name: number,                
                description: number,   
                dateCreated: Date             
            }>({
                context,
                fetchOptions
            });


            // Kutsu read-funktiota
            const result = await dataService.statistics();

            // Tarkista, että ApiClient.get kutsuttiin oikein
            expect(apiClientMock).toHaveBeenCalledWith('/test', fetchOptions);

            // Tarkista, että paluuarvo vastaa odotuksia
            expect(result).toEqual(responseData);
        });
    })

});