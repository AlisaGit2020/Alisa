
import DataService from "./data-service";
import AssetContext from "@asset-lib/asset-contexts";
import ApiClient from "./api-client";

describe('Data service', () => {

    const context: AssetContext = {
        apiPath: 'test/data',
        name: 'Test context',
        routePath: 'path/test/data'
    }

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
            const apiClientMock = jest.spyOn(ApiClient, 'get');
            const responseData = { id: 1, name: 'Test Data' };
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AssetContext;
            const dataService = new DataService<{ transaction: { totalAmount: number } }>({ context, relations: { transaction: true } });

            const result = await dataService.read(1);

            expect(apiClientMock).toHaveBeenCalledWith('/test', 1, { transaction: true });
            expect(result).toEqual(responseData);
        });
    })

    describe('Save', () => {
        it('should save data successfully with POST when no id', async () => {

            const apiClientPostMock = jest.spyOn(ApiClient, 'post');
            apiClientPostMock.mockResolvedValueOnce({ id: 1, name: 'Test Data' });

            const context = { apiPath: '/test' } as AssetContext;
            const dataService = new DataService({ context });

            const validData = { name: 'Test Data' };
            const result = await dataService.save(validData);

            expect(apiClientPostMock).toHaveBeenCalledWith('/test', validData);
            expect(result).toEqual({ id: 1, name: 'Test Data' });
        });

        it('should save data successfully with PUT when id provided', async () => {

            const apiClientPutMock = jest.spyOn(ApiClient, 'put');
            apiClientPutMock.mockResolvedValueOnce({ id: 1, name: 'Test Data' });

            const context = { apiPath: '/test' } as AssetContext;
            const dataService = new DataService({ context });

            const validData = { name: 'Test Data' };
            const result = await dataService.save(validData, 1);

            expect(apiClientPutMock).toHaveBeenCalledWith('/test', 1, validData);
            expect(result).toEqual({ id: 1, name: 'Test Data' });
        });
    });

    describe('Delete', () => {
        it('deletes data successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'delete');
            apiClientMock.mockResolvedValueOnce(undefined);

            const context = { apiPath: '/test' } as AssetContext;
            const dataService = new DataService<{ transaction: { totalAmount: number } }>({ context, relations: { transaction: true } });

            await dataService.delete(1);
            expect(apiClientMock).toHaveBeenCalledWith('/test', 1);

        }, 10000);
    })

    describe('Search', () => {
        it('should search data successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'search');
            const responseData = [{ id: 1, name: 'Test Data' }];
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AssetContext;
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

            const result = await dataService.search();

            expect(apiClientMock).toHaveBeenCalledWith('/test', fetchOptions);
            expect(result).toEqual(responseData);
        });
    })

    describe('Statistics', () => {
        it('should get statistics successfully', async () => {
            const apiClientMock = jest.spyOn(ApiClient, 'statistics');
            const responseData = [{ rowCount: 11, total: 206 }];
            apiClientMock.mockResolvedValueOnce(responseData);

            const context = { apiPath: '/test' } as AssetContext;
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

            const result = await dataService.statistics();

            expect(apiClientMock).toHaveBeenCalledWith('/test', fetchOptions);
            expect(result).toEqual(responseData);
        });
    })

});
