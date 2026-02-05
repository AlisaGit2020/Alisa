/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/*.(test|spec).[jt]s?(x)',
  ],
  moduleNameMapper: {
    "^@alisa-backend/(.*)": "<rootDir>../backend/src/$1",
    "^@alisa-lib/(.*)": "<rootDir>/src/lib/$1",
    "^@alisa-mocks/(.*)": "<rootDir>/test/mocks/$1",
    "^@test-utils/(.*)": "<rootDir>/test/utils/$1",
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  // Transform MSW ESM modules to CJS for Jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.m?js$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@mswjs|msw)/)',
  ],
};