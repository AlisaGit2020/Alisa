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
    "^@asset-lib/(.*)": "<rootDir>/src/lib/$1",
    "^@asset-types$": "<rootDir>/src/types/index.ts",
    "^@asset-types/(.*)": "<rootDir>/src/types/$1",
    "^@asset-mocks/(.*)": "<rootDir>/test/mocks/$1",
    "^@test-utils$": "<rootDir>/test/utils/index.ts",
    "^@test-utils/(.*)": "<rootDir>/test/utils/$1",
    "^@asset-backend/(.*)": "<rootDir>/../backend/src/$1",
    // Map .js imports to .ts files (for ESM compatibility)
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Mock constants to provide test environment variables
    // Match relative paths to constants file (from various depths)
    "^\\.\\./constants$": "<rootDir>/test/mocks/constants.ts",
    "^\\.\\./\\.\\./constants$": "<rootDir>/test/mocks/constants.ts",
    "^\\.\\./\\.\\./\\.\\./constants$": "<rootDir>/test/mocks/constants.ts",
    "^\\.\\./\\.\\./\\.\\./\\.\\./constants$": "<rootDir>/test/mocks/constants.ts",
    // Mock react-helmet-async for testing
    "^react-helmet-async$": "<rootDir>/test/mocks/react-helmet-async.tsx",
    // Mock PageMeta to avoid import.meta.env issues in tests
    "^(.*)/components/seo/PageMeta(.*)$": "<rootDir>/test/mocks/PageMeta.tsx",
    // Mock react-auth-kit for testing
    "^react-auth-kit/hooks/useIsAuthenticated$": "<rootDir>/test/mocks/react-auth-kit.tsx",
    "^react-auth-kit/hooks/useSignOut$": "<rootDir>/test/mocks/use-sign-out.tsx",
    "^@auth-kit/react-router/AuthOutlet$": "<rootDir>/test/mocks/auth-outlet.tsx",
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
  // Collect coverage from source files
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  // Coverage thresholds - enforced on CI
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};