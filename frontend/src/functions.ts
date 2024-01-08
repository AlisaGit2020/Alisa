import { ValidationError, validate } from "class-validator";

export default function getApiUrl(path: string) {
    const apiBasePath = import.meta.env.VITE_API_URL;
    return `${apiBasePath}/${path}`;
}

export function getNumber(value: string, decimals: number) {

    if (!value) {
        return '';
    }

    const floatNumber = parseFloat(value)
    if (floatNumber) {
        return parseFloat(floatNumber.toFixed(decimals));
    }
}

export async function getValidationErrors<T>(validateObject: object, data: T): Promise<ValidationError[]> {

    copyMatchingKeyValues(validateObject, data)

    return await validate(validateObject, { skipMissingProperties: true });
}

function copyMatchingKeyValues(Target: any, Source: any) {
    return Object.keys(Source).forEach(key => {
        if (Source[key] !== undefined)
            Target[key] = Source[key];
    });
}
