// frontend/test/translations.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import en from '../src/translations/en';
import fi from '../src/translations/fi';

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

    const missingKeys = staticKeys.filter(key => !availableKeys.has(key));

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
});
