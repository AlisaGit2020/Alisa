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
    copyMatchingKeyValues(validateObject, data as object)

    return await validate(validateObject, { skipMissingProperties: true });
}

export function copyMatchingKeyValues<T extends object>(
    target: T,
    source: Partial<T>
): void {
    Object.keys(source).forEach((key) => {
        const typedKey = key as keyof T;
        if (source[typedKey] !== undefined) {
            target[typedKey] = source[typedKey] as T[keyof T];
        }
    });
}

