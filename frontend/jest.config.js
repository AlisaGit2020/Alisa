/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/*.(test|spec).[jt]s?(x)',
  ],
  moduleNameMapper: {
    "^@alisa-lib/(.*)": "<rootDir>/src/lib/$1",
    "^@alisa-types$": "<rootDir>/src/types/index.ts",
    "^@alisa-types/(.*)": "<rootDir>/src/types/$1",
    "^@alisa-mocks/(.*)": "<rootDir>/test/mocks/$1",
    "^@test-utils/(.*)": "<rootDir>/test/utils/$1",
    // Map .js imports to .ts files (for ESM compatibility)
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Mock constants to provide test environment variables
    "^@/constants$": "<rootDir>/test/mocks/constants.ts",
    "^../constants$": "<rootDir>/test/mocks/constants.ts",
    "^\\.\\./constants$": "<rootDir>/test/mocks/constants.ts",
  },
  setupFiles: ['<rootDir>/test/jest.polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  // Transform MSW ESM modules to CJS for Jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        moduleResolution: 'bundler',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|@bundled-es-modules)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Inject jest globals
  injectGlobals: true,
};