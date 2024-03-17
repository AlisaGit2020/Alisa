export type TestData = {
  name: string;
  tables: string[];
  baseUrl: string;
  baseUrlWithId: string;
  hasDefault: boolean;
  inputPost: any;
  inputPut: any;
  expected: any;
  expectedPut: any;
  searchOptions: any;
};
