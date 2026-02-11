// frontend/test/utils/test-i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import property from '../../src/translations/property/en';
import settings from '../../src/translations/settings/en';
import expenseType from '../../src/translations/expense-type/en';
import incomeType from '../../src/translations/income-type/en';
import admin from '../../src/translations/admin/en';
import investmentCalculator from '../../src/translations/investment-calculator/en';
import landing from '../../src/translations/landing/en';

// Create a simple i18n instance for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation', 'property', 'settings', 'expense-type', 'income-type', 'admin', 'investment-calculator', 'landing'],
  defaultNS: 'translation',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {},
      property,
      settings,
      'expense-type': expenseType,
      'income-type': incomeType,
      admin,
      'investment-calculator': investmentCalculator,
      landing,
    },
  },
});

export default i18n;
