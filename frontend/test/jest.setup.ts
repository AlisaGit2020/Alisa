// frontend/test/jest.setup.ts
require('reflect-metadata');
import { server } from './msw/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that are added during tests
afterEach(() => server.resetHandlers());

// Clean up after tests are finished
afterAll(() => server.close());

