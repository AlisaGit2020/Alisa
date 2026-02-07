// Skip this test - import.meta.glob is a Vite compile-time feature
// that cannot be tested in Jest. The translation loading is tested
// indirectly through other component tests.
describe.skip('loadTranslations', () => {
  it('loads translations for available languages and namespaces', async () => {
    // This test cannot run in Jest because import.meta.glob
    // is transformed at build time by Vite
  });
});
