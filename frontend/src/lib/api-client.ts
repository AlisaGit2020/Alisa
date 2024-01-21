import axios from "axios";
import { TypeOrmFetchOptions, TypeOrmRelationOption } from "./types";
import Logger from "./logger";

class ApiClient {

    public static async get<T extends { id: number }>(
        path: string,
        id: number,
        relations?: TypeOrmRelationOption
    ): Promise<T> {
        if (id === undefined) {
            ApiClient.handleError(`ID is missing ${path}`);
        }

        const result = await ApiClient.search(path, {
            where: {
                id: id
            },
            relations: relations
        } as TypeOrmFetchOptions<T>);

        return result[0];
    }

    public static async post<T>(path: string, data: object): Promise<T> {
        Logger.info(data);
        return axios.post(ApiClient.getApiUrl(path), data)
    }

    public static async put<T>(path: string, id: number, data: object): Promise<T> {
        Logger.info(data);
        return axios.put(ApiClient.getApiUrl(`${path}/${id}`), data)
    }

    public static async delete(path:string, id:number) {            
        await axios.delete(`${path}/${id}`);
    }

    public static async getDefault<T>(path: string): Promise<T> {        
        return axios.get(ApiClient.getApiUrl(`${path}/default`))
    }

    public static async search<T>(
        path: string,
        options?: TypeOrmFetchOptions<T>
    ): Promise<T[]> {
        Logger.info(path);
        const url = ApiClient.getApiUrl(`${path}/search`);
        try {
            return (await axios.post<T[]>(url, options)).data;
        } catch (error) {
            ApiClient.handleError(`Error in search path ${url}`);
        }
    }

    private static getApiUrl(path: string) {
        const apiBasePath = import.meta.env.VITE_API_URL;
        return `${apiBasePath}/${path}`;
    }

    private static handleError(message: string): never {

        Logger.error(message);
        throw new Error(message);
    }

}

export default ApiClient