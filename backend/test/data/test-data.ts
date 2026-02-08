/**
 * Test data configuration for generic e2e test harness.
 * Uses `unknown` types for flexibility across different entity types.
 */
export type TestData = {
  name: string;
  tables: string[];
  baseUrl: string;
  baseUrlWithId: string;
  hasDefault: boolean;
  inputPost: unknown;
  inputPut: unknown;
  expected: unknown;
  expectedPut: unknown;
  searchOptions: unknown;
};
