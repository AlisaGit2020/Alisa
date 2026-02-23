import { ExpenseTypeKey, IncomeTypeKey } from '@asset-backend/common/types';

// Import all translation files
import expenseTypeEn from '../../src/translations/expense-type/en';
import expenseTypeFi from '../../src/translations/expense-type/fi';
import expenseTypeSv from '../../src/translations/expense-type/sv';
import incomeTypeEn from '../../src/translations/income-type/en';
import incomeTypeFi from '../../src/translations/income-type/fi';
import incomeTypeSv from '../../src/translations/income-type/sv';

describe('Type Translations', () => {
  const languages = ['en', 'fi', 'sv'] as const;

  describe('Expense Type Translations', () => {
    const expenseTypeTranslations = {
      en: expenseTypeEn,
      fi: expenseTypeFi,
      sv: expenseTypeSv,
    };

    const allExpenseTypeKeys = Object.values(ExpenseTypeKey);

    it.each(allExpenseTypeKeys)(
      'should have translation for expense type "%s" in all languages',
      (key) => {
        for (const lang of languages) {
          const translations = expenseTypeTranslations[lang];
          expect(translations).toHaveProperty(key);
          expect(translations[key as keyof typeof translations]).toBeTruthy();
          expect(
            typeof translations[key as keyof typeof translations],
          ).toBe('string');
        }
      },
    );

    it('should have the same number of type translations in all languages', () => {
      const enKeys = Object.keys(expenseTypeEn).filter((k) =>
        allExpenseTypeKeys.includes(k as ExpenseTypeKey),
      );
      const fiKeys = Object.keys(expenseTypeFi).filter((k) =>
        allExpenseTypeKeys.includes(k as ExpenseTypeKey),
      );
      const svKeys = Object.keys(expenseTypeSv).filter((k) =>
        allExpenseTypeKeys.includes(k as ExpenseTypeKey),
      );

      expect(enKeys.length).toBe(allExpenseTypeKeys.length);
      expect(fiKeys.length).toBe(allExpenseTypeKeys.length);
      expect(svKeys.length).toBe(allExpenseTypeKeys.length);
    });

    it('should have all required label translations in all languages', () => {
      const requiredLabels = [
        'expenseTypes',
        'isTaxDeductible',
        'isCapitalImprovement',
      ];

      for (const lang of languages) {
        const translations = expenseTypeTranslations[lang];
        for (const label of requiredLabels) {
          expect(translations).toHaveProperty(label);
          expect(
            translations[label as keyof typeof translations],
          ).toBeTruthy();
        }
      }
    });
  });

  describe('Income Type Translations', () => {
    const incomeTypeTranslations = {
      en: incomeTypeEn,
      fi: incomeTypeFi,
      sv: incomeTypeSv,
    };

    const allIncomeTypeKeys = Object.values(IncomeTypeKey);

    it.each(allIncomeTypeKeys)(
      'should have translation for income type "%s" in all languages',
      (key) => {
        for (const lang of languages) {
          const translations = incomeTypeTranslations[lang];
          expect(translations).toHaveProperty(key);
          expect(translations[key as keyof typeof translations]).toBeTruthy();
          expect(
            typeof translations[key as keyof typeof translations],
          ).toBe('string');
        }
      },
    );

    it('should have the same number of type translations in all languages', () => {
      const enKeys = Object.keys(incomeTypeEn).filter((k) =>
        allIncomeTypeKeys.includes(k as IncomeTypeKey),
      );
      const fiKeys = Object.keys(incomeTypeFi).filter((k) =>
        allIncomeTypeKeys.includes(k as IncomeTypeKey),
      );
      const svKeys = Object.keys(incomeTypeSv).filter((k) =>
        allIncomeTypeKeys.includes(k as IncomeTypeKey),
      );

      expect(enKeys.length).toBe(allIncomeTypeKeys.length);
      expect(fiKeys.length).toBe(allIncomeTypeKeys.length);
      expect(svKeys.length).toBe(allIncomeTypeKeys.length);
    });

    it('should have all required label translations in all languages', () => {
      const requiredLabels = ['incomeTypes', 'isTaxable'];

      for (const lang of languages) {
        const translations = incomeTypeTranslations[lang];
        for (const label of requiredLabels) {
          expect(translations).toHaveProperty(label);
          expect(
            translations[label as keyof typeof translations],
          ).toBeTruthy();
        }
      }
    });
  });
});
