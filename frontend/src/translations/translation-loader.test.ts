import { loadTranslations } from './translation-loader';

describe('loadTranslations', () => {
  it('loads translations for available languages and namespaces', async () => {
    const availableLanguages = ['en', 'fi'];
    const namespaces = ['apartment', 'expense', 'expense-type', 'menu', 'settings', 'transaction'];

    const result = await loadTranslations(availableLanguages, namespaces);
    
    expect (result).toBeDefined()
    
    // Loop through each language
    for (const language of availableLanguages) {
        // Ensure the language key exists in the result
        expect(result).toHaveProperty(language);
      
        // Loop through each namespace
        for (const namespace of namespaces) {
          // Ensure the namespace key exists in the language's translations
          expect(result[language]).toHaveProperty(namespace);            
        }
      }
  });

});
