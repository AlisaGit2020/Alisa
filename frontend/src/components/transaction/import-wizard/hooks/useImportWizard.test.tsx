// frontend/src/components/transaction/import-wizard/hooks/useImportWizard.test.ts
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { useImportWizard } from './useImportWizard';
import { TransactionType, TransactionStatus } from '@alisa-types';
import { AlisaToastProvider } from '../../../alisa';
import i18n from '../../../../../test/utils/test-i18n';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock getTransactionPropertyId
jest.mock('@alisa-lib/initial-data', () => ({
  getTransactionPropertyId: () => 1,
}));

// Wrapper to provide necessary context for the hook
const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <AlisaToastProvider>
        {children}
      </AlisaToastProvider>
    </I18nextProvider>
  </BrowserRouter>
);

describe('useImportWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initial state', () => {
    it('initializes with default step and bank values', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      expect(result.current.state.activeStep).toBe(0);
      expect(result.current.state.selectedBank).toBeNull();
      expect(result.current.state.files).toEqual([]);
      expect(result.current.state.isUploading).toBe(false);
      expect(result.current.state.uploadError).toBeNull();
      expect(result.current.state.transactions).toEqual([]);
      expect(result.current.state.selectedIds).toEqual([]);
      expect(result.current.state.isApproving).toBe(false);
    });
  });

  describe('Step navigation', () => {
    it('advances to next step with nextStep', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.activeStep).toBe(1);
    });

    it('goes back to previous step with prevStep', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.state.activeStep).toBe(2);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.state.activeStep).toBe(1);
    });

    it('does not go below step 0', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.state.activeStep).toBe(0);
    });

    it('goes to specific step with goToStep', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.state.activeStep).toBe(2);
    });
  });

  describe('File management', () => {
    it('sets files with setFiles', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      act(() => {
        result.current.setFiles(files);
      });

      expect(result.current.state.files).toEqual(files);
    });

    it('clears upload error when setting new files', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      act(() => {
        result.current.setFiles(files);
      });

      expect(result.current.state.uploadError).toBeNull();
    });
  });

  describe('Bank selection', () => {
    it('sets bank with setBank', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.setBank('op');
      });

      expect(result.current.state.selectedBank).toBe('op');
    });

    it('can change bank selection', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.setBank('op');
      });

      expect(result.current.state.selectedBank).toBe('op');

      act(() => {
        result.current.setBank('s-pankki');
      });

      expect(result.current.state.selectedBank).toBe('s-pankki');
    });
  });

  describe('File upload preconditions', () => {
    it('returns empty result when no files', async () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      let uploadResult: { savedIds: number[]; skippedCount: number };

      await act(async () => {
        uploadResult = await result.current.uploadFiles();
      });

      expect(uploadResult!).toEqual({ savedIds: [], skippedCount: 0 });
    });

    it('returns empty result when no bank selected', async () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      act(() => {
        result.current.setFiles(files);
      });

      let uploadResult: { savedIds: number[]; skippedCount: number };

      await act(async () => {
        uploadResult = await result.current.uploadFiles();
      });

      expect(uploadResult!).toEqual({ savedIds: [], skippedCount: 0 });
    });
  });

  describe('Selection management', () => {
    it('handles single item selection', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.handleSelectChange(1, {
          id: 1,
          type: TransactionType.INCOME,
          status: TransactionStatus.PENDING,
          sender: '',
          receiver: '',
          description: '',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: 100,
          balance: 1000,
          propertyId: 1,
        });
      });

      expect(result.current.state.selectedIds).toEqual([1]);
      expect(result.current.state.selectedTransactionTypes).toEqual([TransactionType.INCOME]);
    });

    it('handles item deselection', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      // Select item
      act(() => {
        result.current.handleSelectChange(1, {
          id: 1,
          type: TransactionType.INCOME,
          status: TransactionStatus.PENDING,
          sender: '',
          receiver: '',
          description: '',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: 100,
          balance: 1000,
          propertyId: 1,
        });
      });

      expect(result.current.state.selectedIds).toEqual([1]);

      // Deselect item
      act(() => {
        result.current.handleSelectChange(1);
      });

      expect(result.current.state.selectedIds).toEqual([]);
    });

    it('handles select all', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });
      const items = [
        {
          id: 1,
          type: TransactionType.INCOME,
          status: TransactionStatus.PENDING,
          sender: '',
          receiver: '',
          description: '',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: 100,
          balance: 1000,
          propertyId: 1,
        },
        {
          id: 2,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.PENDING,
          sender: '',
          receiver: '',
          description: '',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: -50,
          balance: 950,
          propertyId: 1,
        },
      ];

      act(() => {
        result.current.handleSelectAllChange([1, 2], items);
      });

      expect(result.current.state.selectedIds).toEqual([1, 2]);
      expect(result.current.state.selectedTransactionTypes).toEqual([
        TransactionType.INCOME,
        TransactionType.EXPENSE,
      ]);
    });

    it('clears selection with clearSelection', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.handleSelectChange(1, {
          id: 1,
          type: TransactionType.INCOME,
          status: TransactionStatus.PENDING,
          sender: '',
          receiver: '',
          description: '',
          transactionDate: new Date(),
          accountingDate: new Date(),
          amount: 100,
          balance: 1000,
          propertyId: 1,
        });
      });

      expect(result.current.state.selectedIds).toEqual([1]);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.state.selectedIds).toEqual([]);
      expect(result.current.state.selectedTransactionTypes).toEqual([]);
    });
  });

  describe('Reset', () => {
    it('resets step and selection state', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      // Make some changes
      act(() => {
        result.current.setBank('op');
        result.current.nextStep();
        result.current.handleSelectChange(1);
      });

      // Verify state has changed
      expect(result.current.state.selectedBank).toBe('op');
      expect(result.current.state.activeStep).toBe(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.activeStep).toBe(0);
      expect(result.current.state.selectedBank).toBeNull();
      expect(result.current.state.selectedIds).toEqual([]);
    });

    it('clears session storage on reset', () => {
      const { result } = renderHook(() => useImportWizard(), { wrapper });

      act(() => {
        result.current.reset();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('importWizard:session');
    });
  });
});
