import { ValidationError } from "class-validator";
import ApiClient from "./api-client";
import { DTO, TypeOrmRelationOption } from "./types";
import AlisaContext from "../alisa-contexts/alisa-contexts";

class DataService<T extends { id: number }> {
    private apiPath: string;
    private relations?: TypeOrmRelationOption;    

    constructor(context: AlisaContext, relations?: TypeOrmRelationOption) {
        this.apiPath = context.apiPath;
        this.relations = relations;
    }

    public async read(id: number): Promise<T> {
        return ApiClient.get<T>(this.apiPath, id, this.relations)
    }

    public async save( data: T, id?: number,): Promise<T | ValidationError> {
        
        if (id) {
            return ApiClient.put<T>(this.apiPath, id, data)
        } else {
            return await ApiClient.post<T>(this.apiPath, data)
        }

    }

    public static ValidationErrorsToStringArray(errors: ValidationError[]): string[] {
        const strErrors: string[] = []
        if (errors.length > 0) {
            errors.forEach((error: ValidationError) => {
                if (error.constraints && typeof error.constraints === 'object') {
                    Object.values(error.constraints).forEach((constraint: string) => {
                        strErrors.push(constraint);
                    });
                }
            });


        }
        return strErrors
    }
}

export default DataService