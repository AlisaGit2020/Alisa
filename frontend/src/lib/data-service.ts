import { ValidationError, validate } from "class-validator";
import ApiClient from "./api-client";
import { DTO, TypeOrmFetchOptions, TypeOrmRelationOption } from "./types";
import AlisaContext from "@alisa-lib/alisa-contexts";
import { copyMatchingKeyValues } from "./functions";

class DataService<T extends object> {
    private apiPath: string;
    private relations?: TypeOrmRelationOption;
    private fetchOptions?: TypeOrmFetchOptions<T>;
    private dataValidateInstance?: object;

    constructor(options: {
        context: AlisaContext,
        relations?: TypeOrmRelationOption,
        fetchOptions?: TypeOrmFetchOptions<T>,
        dataValidateInstance?: object
    }) {
        this.apiPath = options.context.apiPath;
        this.relations = options.relations;
        this.fetchOptions = options.fetchOptions;
        this.dataValidateInstance = options.dataValidateInstance
    }

    public async read(id: number): Promise<T> {
        return ApiClient.get<DTO<T>>(this.apiPath, id, this.relations)
    }

    public async getDefaults(): Promise<T> {
        return ApiClient.getDefault<T>(this.apiPath)
    }

    public async save(data: T, id?: number,): Promise<T | ValidationError[]> {
        const validationErrors = await this.getValidationErrors(data as object);
        if (validationErrors.length > 0) {
            return validationErrors
        }
        if (id) {
            return ApiClient.put<T>(this.apiPath, id, data)
        } else {
            return ApiClient.post<T>(this.apiPath, data)
        }
    }

    public async search(): Promise<T[]> {
        return ApiClient.search(this.apiPath, this.fetchOptions)
    }

    public updateNestedData(data: T, name: string, value: unknown): T {
        const names = name.split('.');

        if (names.length === 1) {
            return { ...data, [name]: value } as T;
        } else {

            const updatedData = { ...data };
            let currentData = updatedData;

            for (let i = 0; i < names.length - 1; i++) {
                const currentName = names[i] as keyof T;
                if (currentName in currentData) {
                    currentData[currentName] = { ...currentData[currentName] };
                    currentData = currentData[currentName] as T;
                }
            }

            const finalName = names[names.length - 1] as keyof T;
            if (finalName in currentData) {
                currentData[finalName] = value as T[keyof T];
            }

            return updatedData as T;
        }
    }

    public async getStrValidationErrors(data: T): Promise<string[]> {
        return this.transformToStringArray(await this.getValidationErrors(data as object))
    }

    private transformToStringArray(errors: ValidationError[]): string[] {
        const strErrors: string[] = []
        if (errors.length > 0) {
            errors.forEach((error: ValidationError) => {
                if (error.constraints && typeof error.constraints === 'object') {
                    Object.values(error.constraints).forEach((constraint: string) => {
                        strErrors.push(constraint);
                    });
                }
                if (error.children && typeof error.children === 'object') {
                    const childrenErrors = this.transformToStringArray(error.children);
                    childrenErrors.forEach((childError: string) => {
                        strErrors.push(error.property + ' ' + childError);
                    });
                }
            });
        }
        return strErrors
    }

    private async getValidationErrors<T extends object>(data: T): Promise<ValidationError[]> {
        if (this.dataValidateInstance === undefined) {
            return []
        }
        copyMatchingKeyValues<T>(this.dataValidateInstance as T, data)
        return await validate(this.dataValidateInstance, { skipMissingProperties: true });
    }
}

export default DataService