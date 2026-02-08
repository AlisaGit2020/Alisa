/**
 * Test data configuration for generic e2e test harness.
 * Uses `object` types for flexibility across different entity types.
 */
export type TestData = {
  name: string;
  tables: string[];
  baseUrl: string;
  baseUrlWithId: string;
  hasDefault: boolean;
  inputPost: object;
  inputPut: object;
  expected: object;
  expectedPut: object;
  searchOptions: object;
};
