// frontend/test/utils/test-i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import property from '../../src/translations/property/en';
import propertyType from '../../src/translations/property-type/en';
import settings from '../../src/translations/settings/en';
import expenseType from '../../src/translations/expense-type/en';
import incomeType from '../../src/translations/income-type/en';
import admin from '../../src/translations/admin/en';
import investmentCalculator from '../../src/translations/investment-calculator/en';
import landing from '../../src/translations/landing/en';
import route from '../../src/translations/route/en';
import en from '../../src/translations/en';

// Partial common namespace - only include keys that tests need translated
// Don't include all keys to avoid breaking tests that expect untranslated keys
const partialCommon = {
  readMore: 'Read more',
  showLess: 'Show less',
  delete: 'Delete',
  cancel: 'Cancel',
  confirm: 'Confirm',
  confirmDelete: 'Confirm Delete',
  save: 'Save',
  toast: {
    error: 'An error occurred',
    updateError: 'Failed to update',
  },
  validation: {
    required: 'This field is required',
    mustBePositive: 'Value must be greater than 0',
  },
  suffix: {
    euroPerMonth: '€/mo',
    squareMeters: 'm²',
    years: 'yrs',
  },
};

// Create a simple i18n instance for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation', 'property', 'property-type', 'settings', 'expense-type', 'income-type', 'admin', 'investment-calculator', 'landing', 'common', 'expenseTypes', 'incomeTypes', 'route'],
  defaultNS: 'translation',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        // Include expense and income type translations for components that use t('expenseTypes.key')
        expenseTypes: en.expenseTypes,
        incomeTypes: en.incomeTypes,
      },
      property,
      'property-type': propertyType,
      settings,
      'expense-type': expenseType,
      'income-type': incomeType,
      admin,
      'investment-calculator': investmentCalculator,
      landing,
      route,
      common: partialCommon,
      // Add expenseTypes and incomeTypes as namespaces for components using t('namespace:key')
      expenseTypes: en.expenseTypes,
      incomeTypes: en.incomeTypes,
    },
  },
});

export default i18n;
