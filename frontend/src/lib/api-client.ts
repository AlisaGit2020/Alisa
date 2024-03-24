import axios from "axios";
import { TypeOrmFetchOptions, TypeOrmRelationOption } from "./types";
import Logger from "./logger";
import { VITE_API_URL } from "../constants";
import { User } from "@alisa-backend/people/user/entities/user.entity";
import Cookies from "js-cookie";

class ApiClient {
  private static async getOptions(headers?: Record<string, string>) {
    return {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${await ApiClient.getToken()}`,
        ...headers,
      },
    };
  }

  private static async getTokenAttempt() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = Cookies.get("_auth");
        if (token) {
          resolve(token);
        }
      }, 5);
    });
  }

  public static getToken() {
    return ApiClient.getTokenAttempt();
  }

  public static async authGoogle(): Promise<string> {
    return ApiClient.getApiUrl("auth/google");
  }

  public static async get<T extends { id: number }>(
    path: string,
    id: number,
    relations?: TypeOrmRelationOption,
  ): Promise<T> {
    if (id === undefined) {
      ApiClient.handleError(`ID is missing ${path}`);
    }

    const result = await ApiClient.search(path, {
      where: {
        id: id,
      },
      relations: relations,
    } as TypeOrmFetchOptions<T>);

    return result[0];
  }

  public static async post<T>(path: string, data: T): Promise<T> {
    return axios.post(
      ApiClient.getApiUrl(path),
      data,
      await ApiClient.getOptions(),
    );
  }

  public static async put<T>(path: string, id: number, data: T): Promise<T> {
    return axios.put(
      ApiClient.getApiUrl(`${path}/${id}`),
      data,
      await ApiClient.getOptions(),
    );
  }

  public static async delete(path: string, id: number) {
    await axios.delete(
      ApiClient.getApiUrl(`${path}/${id}`),
      await ApiClient.getOptions(),
    );
  }

  public static async getDefault<T>(path: string): Promise<T> {
    const response = await axios.get(
      ApiClient.getApiUrl(`${path}/default`),
      await ApiClient.getOptions(),
    );
    return response.data;
  }

  public static async me(): Promise<User> {
    const response = await axios.get(
      ApiClient.getApiUrl(`auth/user`),
      await ApiClient.getOptions(),
    );
    return response.data;
  }

  public static async upload<T>(path: string, data: T): Promise<T> {
    const options = await ApiClient.getOptions({
      "Content-Type": "multipart/form-data",
    });
    return axios.post(ApiClient.getApiUrl(path), data, options);
  }

  public static async search<T>(
    path: string,
    options?: TypeOrmFetchOptions<T>,
  ): Promise<T[]> {
    const url = ApiClient.getApiUrl(`${path}/search`);
    try {
      return (await axios.post<T[]>(url, options, await ApiClient.getOptions()))
        .data;
    } catch (error) {
      ApiClient.handleError(`Error in search path ${url}`);
    }
  }

  public static async statistics<T, K>(
    path: string,
    options?: TypeOrmFetchOptions<T>,
  ): Promise<K> {
    const url = ApiClient.getApiUrl(`${path}/search/statistics`);
    try {
      return (await axios.post<K>(url, options, await ApiClient.getOptions()))
        .data;
    } catch (error) {
      ApiClient.handleError(`Error in search path ${url}`);
    }
  }

  private static getApiUrl(path: string) {
    return `${VITE_API_URL}/${path}`;
  }

  private static handleError(message: string): never {
    Logger.error(message);
    throw new Error(message);
  }
}

export default ApiClient;
