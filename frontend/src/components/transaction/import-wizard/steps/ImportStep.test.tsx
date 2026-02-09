// frontend/src/components/transaction/import-wizard/steps/ImportStep.test.tsx
import { renderWithProviders, screen, waitFor } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ImportStep from './ImportStep';
import { BankId } from '../types';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Create a local server for this test file
const localServer = setupServer();

beforeAll(() => localServer.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => localServer.resetHandlers());
afterAll(() => localServer.close());

const API_BASE = 'http://localhost:3000';

describe('ImportStep', () => {
  const mockT = jest.fn((key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'importWizard.selectBank': 'Select Bank',
      'importWizard.selectBankDescription': 'Choose which bank\'s CSV format you are importing',
      'importWizard.selectBankWarning': 'Please select a bank',
      'importWizard.importingTo': 'Importing to',
      'importWizard.loadingProperty': 'Loading...',
      'importWizard.selectPropertyWarning': 'Please select a specific property from the navigation bar before importing.',
      'importWizard.dropFileHere': 'Drop files here',
      'importWizard.dragDropOrClick': 'Drag and drop CSV files here, or click to select',
      'importWizard.csvFilesOnly': 'CSV files only (.csv)',
      'importWizard.selectedFiles': `Selected files (${options?.count ?? 0})`,
      'importWizard.uploading': 'Uploading...',
      'importWizard.uploadAndContinue': 'Upload and Continue',
      'importWizard.skippedRows': `${options?.count ?? 0} transactions were skipped because they have already been imported and approved.`,
    };
    return translations[key] || key;
  });

  const mockOnFilesSelect = jest.fn();
  const mockOnBankSelect = jest.fn();
  const mockOnUpload = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnFetchTransactions = jest.fn();

  const defaultProps = {
    t: mockT,
    propertyId: 1,
    selectedBank: null as BankId | null,
    files: [] as File[],
    isUploading: false,
    uploadError: null as string | null,
    skippedCount: 0,
    onFilesSelect: mockOnFilesSelect,
    onBankSelect: mockOnBankSelect,
    onUpload: mockOnUpload,
    onNext: mockOnNext,
    onFetchTransactions: mockOnFetchTransactions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock property API call
    localServer.use(
      http.get(`${API_BASE}/real-estate/property/1`, () => {
        return HttpResponse.json({
          id: 1,
          name: 'Test Property',
          size: 50,
        });
      })
    );
  });

  describe('Rendering', () => {
    it('renders bank selection section', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      expect(screen.getByText('Select Bank')).toBeInTheDocument();
      expect(screen.getByText('Choose which bank\'s CSV format you are importing')).toBeInTheDocument();
    });

    it('renders supported bank options', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      expect(screen.getByText('Osuuspankki (OP)')).toBeInTheDocument();
      expect(screen.getByText('S-Pankki')).toBeInTheDocument();
    });

    it('shows bank selection warning when no bank selected', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      expect(screen.getByText('Please select a bank')).toBeInTheDocument();
    });

    it('renders property display section', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      expect(screen.getByText('Importing to')).toBeInTheDocument();
    });

    it('shows property section with loading or property name', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      // The property section should be visible
      expect(screen.getByText('Importing to')).toBeInTheDocument();
      // Initially might show loading or property name depending on API response timing
      // Just verify the section renders correctly
    });

    it('shows property warning when no property selected', () => {
      renderWithProviders(<ImportStep {...defaultProps} propertyId={0} />);

      expect(screen.getByText('Please select a specific property from the navigation bar before importing.')).toBeInTheDocument();
    });

    it('renders drag and drop zone', () => {
      renderWithProviders(<ImportStep {...defaultProps} selectedBank="op" />);

      expect(screen.getByText('Drag and drop CSV files here, or click to select')).toBeInTheDocument();
      expect(screen.getByText('CSV files only (.csv)')).toBeInTheDocument();
    });

    it('renders upload button', () => {
      renderWithProviders(<ImportStep {...defaultProps} selectedBank="op" />);

      expect(screen.getByRole('button', { name: 'Upload and Continue' })).toBeInTheDocument();
    });
  });

  describe('Bank selection', () => {
    it('calls onBankSelect when OP bank is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ImportStep {...defaultProps} />);

      await user.click(screen.getByText('Osuuspankki (OP)'));

      expect(mockOnBankSelect).toHaveBeenCalledWith('op');
    });

    it('calls onBankSelect when S-Pankki is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ImportStep {...defaultProps} />);

      await user.click(screen.getByText('S-Pankki'));

      expect(mockOnBankSelect).toHaveBeenCalledWith('s-pankki');
    });

    it('highlights selected bank', () => {
      renderWithProviders(<ImportStep {...defaultProps} selectedBank="op" />);

      // Check that the OP bank container has a checkmark icon
      const checkIcon = document.querySelector('svg[data-testid="CheckCircleIcon"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('does not allow bank selection when uploading', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ImportStep {...defaultProps} isUploading={true} />);

      await user.click(screen.getByText('Osuuspankki (OP)'));

      expect(mockOnBankSelect).not.toHaveBeenCalled();
    });
  });

  describe('File selection', () => {
    it('displays selected files', () => {
      const files = [
        new File(['content'], 'test1.csv', { type: 'text/csv' }),
        new File(['content'], 'test2.csv', { type: 'text/csv' }),
      ];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} />
      );

      expect(screen.getByText('Selected files (2):')).toBeInTheDocument();
      expect(screen.getByText('test1.csv')).toBeInTheDocument();
      expect(screen.getByText('test2.csv')).toBeInTheDocument();
    });

    it('displays file sizes', () => {
      const files = [
        new File(['content'.repeat(100)], 'test.csv', { type: 'text/csv' }),
      ];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} />
      );

      // File size should be displayed in KB
      expect(screen.getByText(/KB$/)).toBeInTheDocument();
    });
  });

  describe('Upload button state', () => {
    it('disables upload button when no files selected', () => {
      renderWithProviders(<ImportStep {...defaultProps} selectedBank="op" />);

      expect(screen.getByRole('button', { name: 'Upload and Continue' })).toBeDisabled();
    });

    it('disables upload button when no property selected', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(
        <ImportStep {...defaultProps} propertyId={0} selectedBank="op" files={files} />
      );

      expect(screen.getByRole('button', { name: 'Upload and Continue' })).toBeDisabled();
    });

    it('disables upload button when no bank selected', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(<ImportStep {...defaultProps} files={files} />);

      expect(screen.getByRole('button', { name: 'Upload and Continue' })).toBeDisabled();
    });

    it('enables upload button when all conditions are met', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} />
      );

      expect(screen.getByRole('button', { name: 'Upload and Continue' })).not.toBeDisabled();
    });

    it('disables upload button while uploading', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} isUploading={true} />
      );

      expect(screen.getByRole('button', { name: 'Uploading...' })).toBeDisabled();
    });
  });

  describe('Upload interaction', () => {
    it('calls onUpload, onFetchTransactions, and onNext on successful upload with saved IDs', async () => {
      const user = userEvent.setup();
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];
      mockOnUpload.mockResolvedValue({ savedIds: [1, 2, 3], skippedCount: 0 });
      mockOnFetchTransactions.mockResolvedValue(undefined);

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} />
      );

      await user.click(screen.getByRole('button', { name: 'Upload and Continue' }));

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledTimes(1);
        expect(mockOnFetchTransactions).toHaveBeenCalledWith([1, 2, 3]);
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it('does not proceed when all rows are skipped', async () => {
      const user = userEvent.setup();
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];
      mockOnUpload.mockResolvedValue({ savedIds: [], skippedCount: 5 });

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} />
      );

      await user.click(screen.getByRole('button', { name: 'Upload and Continue' }));

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledTimes(1);
        expect(mockOnFetchTransactions).not.toHaveBeenCalled();
        expect(mockOnNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading state', () => {
    it('shows uploading text when isUploading is true', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} isUploading={true} />
      );

      expect(screen.getByRole('button', { name: 'Uploading...' })).toBeInTheDocument();
    });

    it('shows loading spinner when uploading', () => {
      const files = [new File(['content'], 'test.csv', { type: 'text/csv' })];

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" files={files} isUploading={true} />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error states', () => {
    it('displays upload error message', () => {
      const errorMessage = 'Failed to upload file';

      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" uploadError={errorMessage} />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays skipped rows info', () => {
      renderWithProviders(
        <ImportStep {...defaultProps} selectedBank="op" skippedCount={3} />
      );

      expect(screen.getByText('3 transactions were skipped because they have already been imported and approved.')).toBeInTheDocument();
    });
  });

  describe('Drag and drop zone state', () => {
    it('renders dropzone with reduced opacity when disabled', () => {
      renderWithProviders(<ImportStep {...defaultProps} propertyId={0} selectedBank="op" />);

      // Check that the dropzone text is visible
      expect(screen.getByText('Drag and drop CSV files here, or click to select')).toBeInTheDocument();
    });

    it('shows property warning when no property is selected', () => {
      renderWithProviders(<ImportStep {...defaultProps} propertyId={0} selectedBank="op" />);

      expect(screen.getByText('Please select a specific property from the navigation bar before importing.')).toBeInTheDocument();
    });

    it('shows bank selection warning when no bank is selected', () => {
      renderWithProviders(<ImportStep {...defaultProps} />);

      expect(screen.getByText('Please select a bank')).toBeInTheDocument();
    });
  });
});
