// frontend/test/jest.setup.ts
import 'reflect-metadata';
import 'whatwg-fetch';
import '@testing-library/jest-dom';

// Import jest globals for ESM mode
import { jest, beforeAll, afterEach, afterAll } from '@jest/globals';

// Make jest available globally for all tests
(globalThis as any).jest = jest;

// MSW server setup
import { server } from './msw/server.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

