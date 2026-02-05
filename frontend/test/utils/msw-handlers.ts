// frontend/test/utils/msw-handlers.ts
import { http, HttpResponse, PathParams } from 'msw';

const API_BASE = 'http://localhost:3000';

/**
 * MSW handler utilities for common API patterns
 */
export const handlers = {
  /**
   * Mock GET request with success response
   */
  get: <T>(endpoint: string, data: T) => {
    return http.get(`${API_BASE}${endpoint}`, () => {
      return HttpResponse.json(data);
    });
  },

  /**
   * Mock POST request with success response
   */
  post: <T>(endpoint: string, data: T) => {
    return http.post(`${API_BASE}${endpoint}`, () => {
      return HttpResponse.json(data, { status: 201 });
    });
  },

  /**
   * Mock PUT request with success response
   */
  put: <T>(endpoint: string, data: T) => {
    return http.put(`${API_BASE}${endpoint}`, () => {
      return HttpResponse.json(data);
    });
  },

  /**
   * Mock DELETE request with success response
   */
  delete: (endpoint: string) => {
    return http.delete(`${API_BASE}${endpoint}`, () => {
      return new HttpResponse(null, { status: 204 });
    });
  },

  /**
   * Mock API error response
   */
  error: (endpoint: string, status: number, message: string, method: 'get' | 'post' | 'put' | 'delete' = 'get') => {
    const httpMethod = http[method];
    return httpMethod(`${API_BASE}${endpoint}`, () => {
      return HttpResponse.json(
        { message, statusCode: status },
        { status }
      );
    });
  },
};
