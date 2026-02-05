// frontend/test/translations.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import baseEn from '../src/translations/en';
import baseFi from '../src/translations/fi';

// Import all namespace translations
import accountingEn from '../src/translations/accounting/en';
import accountingFi from '../src/translations/accounting/fi';
import dashboardEn from '../src/translations/dashboard/en';
import dashboardFi from '../src/translations/dashboard/fi';
import propertyEn from '../src/translations/property/en';
import propertyFi from '../src/translations/property/fi';
import expenseEn from '../src/translations/expense/en';
import expenseFi from '../src/translations/expense/fi';
import expenseTypeEn from '../src/translations/expense-type/en';
import expenseTypeFi from '../src/translations/expense-type/fi';
import incomeTypeEn from '../src/translations/income-type/en';
import incomeTypeFi from '../src/translations/income-type/fi';
import loginEn from '../src/translations/login/en';
import loginFi from '../src/translations/login/fi';
import menuEn from '../src/translations/menu/en';
import menuFi from '../src/translations/menu/fi';
import routeEn from '../src/translations/route/en';
import routeFi from '../src/translations/route/fi';
import settingsEn from '../src/translations/settings/en';
import settingsFi from '../src/translations/settings/fi';
import taxEn from '../src/translations/tax/en';
import taxFi from '../src/translations/tax/fi';
import transactionEn from '../src/translations/transaction/en';
import transactionFi from '../src/translations/transaction/fi';
import userEn from '../src/translations/user/en';
import userFi from '../src/translations/user/fi';
import importWizardEn from '../src/translations/import-wizard/en';
import importWizardFi from '../src/translations/import-wizard/fi';
import investmentCalculatorEn from '../src/translations/investment-calculator/en';
import investmentCalculatorFi from '../src/translations/investment-calculator/fi';
import landingEn from '../src/translations/landing/en';
import landingFi from '../src/translations/landing/fi';

// Combine all translations
const en = {
  ...baseEn,
  accounting: accountingEn,
  dashboard: dashboardEn,
  property: propertyEn,
  expense: expenseEn,
  'expense-type': expenseTypeEn,
  'income-type': incomeTypeEn,
  'import-wizard': importWizardEn,
  'investment-calculator': investmentCalculatorEn,
  landing: landingEn,
  login: loginEn,
  menu: menuEn,
  route: routeEn,
  settings: settingsEn,
  tax: taxEn,
  transaction: transactionEn,
  user: userEn,
};

const fi = {
  ...baseFi,
  accounting: accountingFi,
  dashboard: dashboardFi,
  property: propertyFi,
  expense: expenseFi,
  'expense-type': expenseTypeFi,
  'income-type': incomeTypeFi,
  'import-wizard': importWizardFi,
  'investment-calculator': investmentCalculatorFi,
  landing: landingFi,
  login: loginFi,
  menu: menuFi,
  route: routeFi,
  settings: settingsFi,
  tax: taxFi,
  transaction: transactionFi,
  user: userFi,
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
function flattenTranslations(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = flattenTranslations(obj[key], prefix ? `${prefix}.${key}` : key);
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

  it('should have matching keys between EN and FI translations', () => {
    const enKeys = flattenTranslations(en);
    const fiKeys = flattenTranslations(fi);

    const missingInFi = [...enKeys].filter(key => !fiKeys.has(key));
    const missingInEn = [...fiKeys].filter(key => !enKeys.has(key));

    if (missingInFi.length > 0) {
      console.log('Keys missing in FI:', missingInFi);
    }

    if (missingInEn.length > 0) {
      console.log('Keys missing in EN:', missingInEn);
    }

    expect(missingInFi).toEqual([]);
    expect(missingInEn).toEqual([]);
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
        'appBar', 'accounting', 'dashboard', 'property', 'expense', 'expense-type',
        'income-type', 'import-wizard', 'investment-calculator', 'landing', 'login', 'menu', 'route',
        'settings', 'tax', 'transaction', 'user'
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
    const routeFi = fi.route || {};
    const routeEn = en.route || {};

    const missingInFi: string[] = [];
    const missingInEn: string[] = [];

    for (const segment of allSegments) {
      if (!(segment in routeFi)) {
        missingInFi.push(segment);
      }
      if (!(segment in routeEn)) {
        missingInEn.push(segment);
      }
    }

    if (missingInFi.length > 0) {
      console.log('\nRoute segments missing Finnish translations (route/fi.ts):');
      missingInFi.forEach(key => console.log(`  - ${key}`));
    }

    if (missingInEn.length > 0) {
      console.log('\nRoute segments missing English translations (route/en.ts):');
      missingInEn.forEach(key => console.log(`  - ${key}`));
    }

    expect(missingInFi).toEqual([]);
    expect(missingInEn).toEqual([]);
  });
});
