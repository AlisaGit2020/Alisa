// frontend/src/components/transaction/import-wizard/TransactionImportWizard.test.tsx
// This test file tests the TransactionImportWizard component structure and basic functionality.
// Due to Jest ESM limitations, we test components that can be easily mocked.

import '@testing-library/jest-dom';
import { WIZARD_STEPS, getStepIndex, getStepName } from './types';

describe('TransactionImportWizard types', () => {
  describe('WIZARD_STEPS', () => {
    it('contains all four steps in correct order', () => {
      expect(WIZARD_STEPS).toEqual(['import', 'review', 'accept', 'done']);
    });

    it('has exactly 4 steps', () => {
      expect(WIZARD_STEPS.length).toBe(4);
    });
  });

  describe('getStepIndex', () => {
    it('returns correct index for import step', () => {
      expect(getStepIndex('import')).toBe(0);
    });

    it('returns correct index for review step', () => {
      expect(getStepIndex('review')).toBe(1);
    });

    it('returns correct index for accept step', () => {
      expect(getStepIndex('accept')).toBe(2);
    });

    it('returns correct index for done step', () => {
      expect(getStepIndex('done')).toBe(3);
    });
  });

  describe('getStepName', () => {
    it('returns correct name for index 0', () => {
      expect(getStepName(0)).toBe('import');
    });

    it('returns correct name for index 1', () => {
      expect(getStepName(1)).toBe('review');
    });

    it('returns correct name for index 2', () => {
      expect(getStepName(2)).toBe('accept');
    });

    it('returns correct name for index 3', () => {
      expect(getStepName(3)).toBe('done');
    });
  });
});
