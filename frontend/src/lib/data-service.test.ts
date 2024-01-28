// data-service.test.js
import { ValidationError } from "class-validator";
import DataService from "./data-service";

jest.mock('../../src/constants', () => ({
    VITE_API_URL: 'http://localhost',
}));

describe('Data service', () => {


    describe('Transform validation array', () => {
        it('Transforms Validation array to string array', () => {
            const validationError = new ValidationError()
            validationError.constraints = {
                isNotEmpty: "name should not be empty"
            }

            const validationError2 = new ValidationError()
            validationError2.constraints = {
                isNotEmpty: "size should not be empty"
            }

            const validationErrors = [validationError, validationError2]

            const strErrors = DataService.ValidationErrorsToStringArray(validationErrors)
            
            expect(strErrors).toHaveLength(2)            
            expect(strErrors).toMatchObject(['name should not be empty', 'size should not be empty'])
        });
    })

});
