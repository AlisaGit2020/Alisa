import ApiClient from "./api-client";
import { DTO, TypeOrmFetchOptions, TypeOrmRelationOption } from "./types";
import AssetContext from "@asset-lib/asset-contexts";

class DataService<T extends object> {
    private apiPath: string;
    private relations?: TypeOrmRelationOption;
    private fetchOptions?: TypeOrmFetchOptions<T>;

    constructor(options: {
        context: AssetContext,
        relations?: TypeOrmRelationOption,
        fetchOptions?: TypeOrmFetchOptions<T>,
    }) {
        this.apiPath = options.context.apiPath;
        this.relations = options.relations;
        this.fetchOptions = options.fetchOptions;
    }

    public async read(id: number): Promise<T> {        
        return ApiClient.get<DTO<T>>(this.apiPath, id, this.relations)
    }

    public async getDefaults(): Promise<T> {
        return ApiClient.getDefault<T>(this.apiPath)
    }

    public async save(data: T, id?: number): Promise<T> {
        if (id) {
            return ApiClient.put<T>(this.apiPath, id, data)
        } else {
            if ('file' in data) {
                return ApiClient.upload<T>(this.apiPath, data)
            } else {
                return ApiClient.post<T>(this.apiPath, data)
            }
        }
    }

    public async search(): Promise<T[]> {
        return ApiClient.search<T>(this.apiPath, this.fetchOptions)
    }

    public async statistics<K>(): Promise<K> {
        return ApiClient.statistics<T, K>(this.apiPath, this.fetchOptions)
    }

    public async delete(id: number): Promise<void>{
        await ApiClient.delete(this.apiPath, id)
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

}

export default DataService