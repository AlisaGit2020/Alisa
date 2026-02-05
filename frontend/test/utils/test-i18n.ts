// frontend/test/utils/test-i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Create a simple i18n instance for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {},
    },
  },
});

export default i18n;
