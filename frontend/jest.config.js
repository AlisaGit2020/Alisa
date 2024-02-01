/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],    
  moduleNameMapper: {    
    "^@alisa-backend/(.*)": "<rootDir>../backend/src/$1",
    "^@alisa-lib/(.*)": "<rootDir>/src/lib/$1"
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
};