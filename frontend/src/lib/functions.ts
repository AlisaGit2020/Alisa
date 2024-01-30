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
    copyMatchingKeyValues(validateObject, data as object)

    return await validate(validateObject, { skipMissingProperties: true });
}

export function copyMatchingKeyValues<T extends object>(
    target: T,
    source: Partial<T>
): void {
    Object.keys(source).forEach((key) => {
        const typedKey = key as keyof T;
        const sourceValue = source[typedKey];

        if (sourceValue !== undefined) {
            if (typeof sourceValue === 'object' && sourceValue !== null) {
                
                if (typeof target[typedKey] === 'object' && target[typedKey] !== null) {
                    copyMatchingKeyValues(target[typedKey] as object, sourceValue);
                } else {
                    target[typedKey] = {} as T[keyof T];
                    copyMatchingKeyValues(target[typedKey] as object, sourceValue);
                }
            } else {
                
                target[typedKey] = sourceValue as T[keyof T];
            }
        }
    });
}



