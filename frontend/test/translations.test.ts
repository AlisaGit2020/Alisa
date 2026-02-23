// frontend/test/translations.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import baseEn from '../src/translations/en';
import baseFi from '../src/translations/fi';
import baseSv from '../src/translations/sv';

// Import all namespace translations - English
import accountingEn from '../src/translations/accounting/en';
import adminEn from '../src/translations/admin/en';
import allocationEn from '../src/translations/allocation/en';
import dashboardEn from '../src/translations/dashboard/en';
import expenseEn from '../src/translations/expense/en';
import expenseTypeEn from '../src/translations/expense-type/en';
import financeEn from '../src/translations/finance/en';
import importWizardEn from '../src/translations/import-wizard/en';
import incomeTypeEn from '../src/translations/income-type/en';
import investmentCalculatorEn from '../src/translations/investment-calculator/en';
import landingEn from '../src/translations/landing/en';
import loginEn from '../src/translations/login/en';
import menuEn from '../src/translations/menu/en';
import portfolioEn from '../src/translations/portfolio/en';
import propertyEn from '../src/translations/property/en';
import reportsEn from '../src/translations/reports/en';
import routeEn from '../src/translations/route/en';
import seoEn from '../src/translations/seo/en';
import settingsEn from '../src/translations/settings/en';
import taxEn from '../src/translations/tax/en';
import transactionEn from '../src/translations/transaction/en';
import userEn from '../src/translations/user/en';

// Import all namespace translations - Finnish
import accountingFi from '../src/translations/accounting/fi';
import adminFi from '../src/translations/admin/fi';
import allocationFi from '../src/translations/allocation/fi';
import dashboardFi from '../src/translations/dashboard/fi';
import expenseFi from '../src/translations/expense/fi';
import expenseTypeFi from '../src/translations/expense-type/fi';
import financeFi from '../src/translations/finance/fi';
import importWizardFi from '../src/translations/import-wizard/fi';
import incomeTypeFi from '../src/translations/income-type/fi';
import investmentCalculatorFi from '../src/translations/investment-calculator/fi';
import landingFi from '../src/translations/landing/fi';
import loginFi from '../src/translations/login/fi';
import menuFi from '../src/translations/menu/fi';
import portfolioFi from '../src/translations/portfolio/fi';
import propertyFi from '../src/translations/property/fi';
import reportsFi from '../src/translations/reports/fi';
import routeFi from '../src/translations/route/fi';
import seoFi from '../src/translations/seo/fi';
import settingsFi from '../src/translations/settings/fi';
import taxFi from '../src/translations/tax/fi';
import transactionFi from '../src/translations/transaction/fi';
import userFi from '../src/translations/user/fi';

// Import all namespace translations - Swedish
import accountingSv from '../src/translations/accounting/sv';
import adminSv from '../src/translations/admin/sv';
import allocationSv from '../src/translations/allocation/sv';
import dashboardSv from '../src/translations/dashboard/sv';
import expenseSv from '../src/translations/expense/sv';
import expenseTypeSv from '../src/translations/expense-type/sv';
import financeSv from '../src/translations/finance/sv';
import importWizardSv from '../src/translations/import-wizard/sv';
import incomeTypeSv from '../src/translations/income-type/sv';
import investmentCalculatorSv from '../src/translations/investment-calculator/sv';
import landingSv from '../src/translations/landing/sv';
import loginSv from '../src/translations/login/sv';
import menuSv from '../src/translations/menu/sv';
import portfolioSv from '../src/translations/portfolio/sv';
import propertySv from '../src/translations/property/sv';
import reportsSv from '../src/translations/reports/sv';
import routeSv from '../src/translations/route/sv';
import seoSv from '../src/translations/seo/sv';
import settingsSv from '../src/translations/settings/sv';
import taxSv from '../src/translations/tax/sv';
import transactionSv from '../src/translations/transaction/sv';
import userSv from '../src/translations/user/sv';

// Combine all translations
const en = {
  ...baseEn,
  accounting: accountingEn,
  admin: adminEn,
  allocation: allocationEn,
  dashboard: dashboardEn,
  expense: expenseEn,
  'expense-type': expenseTypeEn,
  finance: financeEn,
  'import-wizard': importWizardEn,
  'income-type': incomeTypeEn,
  'investment-calculator': investmentCalculatorEn,
  landing: landingEn,
  login: loginEn,
  menu: menuEn,
  portfolio: portfolioEn,
  property: propertyEn,
  reports: reportsEn,
  route: routeEn,
  seo: seoEn,
  settings: settingsEn,
  tax: taxEn,
  transaction: transactionEn,
  user: userEn,
};

const fi = {
  ...baseFi,
  accounting: accountingFi,
  admin: adminFi,
  allocation: allocationFi,
  dashboard: dashboardFi,
  expense: expenseFi,
  'expense-type': expenseTypeFi,
  finance: financeFi,
  'import-wizard': importWizardFi,
  'income-type': incomeTypeFi,
  'investment-calculator': investmentCalculatorFi,
  landing: landingFi,
  login: loginFi,
  menu: menuFi,
  portfolio: portfolioFi,
  property: propertyFi,
  reports: reportsFi,
  route: routeFi,
  seo: seoFi,
  settings: settingsFi,
  tax: taxFi,
  transaction: transactionFi,
  user: userFi,
};

const sv = {
  ...baseSv,
  accounting: accountingSv,
  admin: adminSv,
  allocation: allocationSv,
  dashboard: dashboardSv,
  expense: expenseSv,
  'expense-type': expenseTypeSv,
  finance: financeSv,
  'import-wizard': importWizardSv,
  'income-type': incomeTypeSv,
  'investment-calculator': investmentCalculatorSv,
  landing: landingSv,
  login: loginSv,
  menu: menuSv,
  portfolio: portfolioSv,
  property: propertySv,
  reports: reportsSv,
  route: routeSv,
  seo: seoSv,
  settings: settingsSv,
  tax: taxSv,
  transaction: transactionSv,
  user: userSv,
};

// ESM compatibility: Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively scans directory for files matching pattern
 */
function scanDirectory(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (!['node_modules', 'test', 'dist', 'build', '.git'].includes(item)) {
        files.push(...scanDirectory(fullPath, pattern));
      }
    } else if (stat.isFile() && pattern.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extracts translation keys from file content
 */
function extractTranslationKeys(content: string): Set<string> {
  const keys = new Set<string>();

  // Match t('key'), t("key"), {t('key')}, {t("key")}
  const singleQuoteMatches = content.matchAll(/\bt\(['"]([^'"]+)['"]\)/g);
  for (const match of singleQuoteMatches) {
    keys.add(match[1]);
  }

  // Match i18n.t('key'), i18n.t("key")
  const i18nMatches = content.matchAll(/i18n\.t\(['"]([^'"]+)['"]\)/g);
  for (const match of i18nMatches) {
    keys.add(match[1]);
  }

  return keys;
}

/**
 * Flattens nested translation object into dot-notation keys
 */
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      const nested = flattenTranslations(value as Record<string, unknown>, prefix ? `${prefix}.${key}` : key);
      nested.forEach(k => keys.add(k));
    } else {
      keys.add(prefix ? `${prefix}.${key}` : key);
    }
  }

  return keys;
}

describe('Translation Coverage', () => {
  const srcDir = path.join(__dirname, '../src');
  const componentFiles = scanDirectory(srcDir, /\.(tsx?|jsx?)$/);

  it('should find component files to scan', () => {
    expect(componentFiles.length).toBeGreaterThan(0);
  });

  it('should have matching keys between EN, FI, and SV translations', () => {
    const enKeys = flattenTranslations(en);
    const fiKeys = flattenTranslations(fi);
    const svKeys = flattenTranslations(sv);

    const missingInFi = [...enKeys].filter(key => !fiKeys.has(key));
    const missingInSv = [...enKeys].filter(key => !svKeys.has(key));
    const missingInEn = [...fiKeys].filter(key => !enKeys.has(key));
    const missingInEnFromSv = [...svKeys].filter(key => !enKeys.has(key));

    if (missingInFi.length > 0) {
      console.log('Keys missing in FI:', missingInFi);
    }

    if (missingInSv.length > 0) {
      console.log('Keys missing in SV:', missingInSv);
    }

    if (missingInEn.length > 0) {
      console.log('Keys missing in EN (present in FI):', missingInEn);
    }

    if (missingInEnFromSv.length > 0) {
      console.log('Keys missing in EN (present in SV):', missingInEnFromSv);
    }

    expect(missingInFi).toEqual([]);
    expect(missingInSv).toEqual([]);
    expect(missingInEn).toEqual([]);
    expect(missingInEnFromSv).toEqual([]);
  });

  it('should have all used translation keys defined', () => {
    const availableKeys = flattenTranslations(en);
    const usedKeys = new Set<string>();

    // Extract all keys used in component files
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const keys = extractTranslationKeys(content);
      keys.forEach(key => usedKeys.add(key));
    }

    // Filter out dynamic keys (those with variables or complex expressions)
    const staticKeys = [...usedKeys].filter(key => {
      // Skip keys that look like they have variables or expressions
      return !key.includes('${') && !key.includes('{{') && !key.includes('+');
    });

    const missingKeys = staticKeys.filter(key => {
      // Check if key exists directly
      if (availableKeys.has(key)) return false;

      // Check if key has namespace prefix (e.g., 'namespace:key')
      // Convert colon notation to dot notation for checking
      if (key.includes(':')) {
        const dotKey = key.replace(':', '.');
        if (availableKeys.has(dotKey)) return false;
      }

      // Check if key exists in common namespace (fallback)
      // i18n config has fallbackNS: ['common'], so keys without namespace
      // will fallback to common.*
      const commonKey = `common.${key}`;
      if (availableKeys.has(commonKey)) return false;

      // Check if key exists in any namespace
      // Keys can be used without namespace prefix and i18n will search all namespaces
      const namespaces = [
        'accounting', 'admin', 'allocation', 'appBar', 'dashboard', 'expense', 'expense-type',
        'finance', 'import-wizard', 'income-type', 'investment-calculator', 'landing', 'login',
        'menu', 'portfolio', 'property', 'reports', 'route', 'seo', 'settings', 'tax',
        'transaction', 'user'
      ];

      for (const ns of namespaces) {
        if (availableKeys.has(`${ns}.${key}`)) return false;
      }

      return true;
    });

    if (missingKeys.length > 0) {
      console.log('\nTranslation keys used but not defined:');
      missingKeys.forEach(key => console.log(`  - ${key}`));
    }

    expect(missingKeys).toEqual([]);
  });

  it('should not have unused translation keys', () => {
    const availableKeys = flattenTranslations(en);
    const usedKeys = new Set<string>();

    // Extract all keys used in component files
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const keys = extractTranslationKeys(content);
      keys.forEach(key => usedKeys.add(key));
    }

    const unusedKeys = [...availableKeys].filter(key => {
      // Don't flag namespace keys or format templates as unused
      if (key.includes('format.')) return false;
      if (key === 'appBar' || key === 'common') return false;

      // Check if key is used
      return !usedKeys.has(key);
    });

    if (unusedKeys.length > 0) {
      console.log('\nUnused translation keys (can be removed):');
      unusedKeys.forEach(key => console.log(`  - ${key}`));
      console.log(`\nTotal unused keys: ${unusedKeys.length}`);
    }

    // This is a warning test - we log but don't fail
    // Uncomment the line below to enforce no unused keys
    // expect(unusedKeys).toEqual([]);
  });

  it('should have translations for all route segments (breadcrumbs)', () => {
    // Read AppRoutes.tsx to extract all route paths
    const routesFile = path.join(__dirname, '../src/components/AppRoutes.tsx');
    const routesContent = fs.readFileSync(routesFile, 'utf-8');

    // Extract all path props from Route components
    // Matches: path="something" or path='something' or path={`something`}
    const pathMatches = routesContent.matchAll(/path=["'`]([^"'`]+)["'`]/g);

    const allSegments = new Set<string>();

    for (const match of pathMatches) {
      const routePath = match[1];
      // Split path into segments and filter out empty, parameters, and special segments
      const segments = routePath
        .split('/')
        .filter(segment => {
          // Filter out empty segments, parameters (:idParam), app prefix, wildcards, and dynamic segments
          return segment !== '' &&
                 !segment.startsWith(':') &&
                 segment !== 'app' &&
                 segment !== '*' && // exclude wildcard routes
                 !/^\d+$/.test(segment); // exclude numeric IDs
        });

      segments.forEach(segment => allSegments.add(segment));
    }

    // Check that all segments have translations in route namespace
    const routeEnTranslations = en.route || {};
    const routeFiTranslations = fi.route || {};
    const routeSvTranslations = sv.route || {};

    const missingInEn: string[] = [];
    const missingInFi: string[] = [];
    const missingInSv: string[] = [];

    for (const segment of allSegments) {
      if (!(segment in routeEnTranslations)) {
        missingInEn.push(segment);
      }
      if (!(segment in routeFiTranslations)) {
        missingInFi.push(segment);
      }
      if (!(segment in routeSvTranslations)) {
        missingInSv.push(segment);
      }
    }

    if (missingInEn.length > 0) {
      console.log('\nRoute segments missing English translations (route/en.ts):');
      missingInEn.forEach(key => console.log(`  - ${key}`));
    }

    if (missingInFi.length > 0) {
      console.log('\nRoute segments missing Finnish translations (route/fi.ts):');
      missingInFi.forEach(key => console.log(`  - ${key}`));
    }

    if (missingInSv.length > 0) {
      console.log('\nRoute segments missing Swedish translations (route/sv.ts):');
      missingInSv.forEach(key => console.log(`  - ${key}`));
    }

    expect(missingInEn).toEqual([]);
    expect(missingInFi).toEqual([]);
    expect(missingInSv).toEqual([]);
  });
});
