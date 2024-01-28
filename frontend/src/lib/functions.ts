import { ValidationError, validate } from "class-validator";

export function getNumber(value: string, decimals: number): number {
    
    if (value === '0') {
        return 0;
    }

    if (!value) {
        return 0;
    }

    const floatNumber = parseFloat(value)
    if (floatNumber) {
        return parseFloat(floatNumber.toFixed(decimals));
    }
    return 0
}

export async function getValidationErrors<T>(validateObject: object, data: T): Promise<ValidationError[]> {
    console.log(data);
    copyMatchingKeyValues(validateObject, data)

    return await validate(validateObject, { skipMissingProperties: true });
}

export function copyMatchingKeyValues(Target: object, Source: any) {
    return Object.keys(Source).forEach(key => {
        if (Source[key] !== undefined){            
            Target[key] = Source[key];
        }
            
    });
}
