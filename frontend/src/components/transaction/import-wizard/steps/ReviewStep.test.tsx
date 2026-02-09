// frontend/src/components/transaction/import-wizard/steps/ReviewStep.test.tsx
import { renderWithProviders, screen } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Transaction, TransactionType, TransactionStatus } from '@alisa-types';

// Mock TransactionsPendingActions
jest.mock(
  '@/components/transaction/pending/TransactionsPendingActions',
  () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) => {
      if (!open) return null;
      return <div data-testid="pending-actions">Actions</div>;
    },
  }),
  { virtual: true }
);

// Mock TransactionDetails
jest.mock(
  '@/components/transaction/components/TransactionDetails',
  () => ({
    __esModule: true,
    default: () => <div data-testid="transaction-details">Details</div>,
  }),
  { virtual: true }
);

// Mock AlisaDataTable
jest.mock(
  '@/components/alisa/datatable/AlisaDataTable',
  () => ({
    __esModule: true,
    default: () => <div data-testid="data-table">Table</div>,
  }),
  { virtual: true }
);

// Import ReviewStep after mocks are set up
import ReviewStep from './ReviewStep';

describe('ReviewStep', () => {
  const mockT = jest.fn((key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'importWizard.skippedRows': `${options?.count ?? 0} transactions were skipped`,
      'importWizard.unknownTypesWarning': 'Some transactions have unknown types. Please categorize all transactions before proceeding.',
      'importWizard.unknownOnly': 'Unknown only',
      'importWizard.showAll': 'Show all',
      'importWizard.allFields': 'All fields',
      'importWizard.showingCount': `Showing ${options?.count ?? 0} rows`,
      'importWizard.back': 'Back',
      'importWizard.next': 'Next',
      'searchField': 'Search from',
      'sender': 'Sender',
      'receiver': 'Receiver',
      'description': 'Description',
      'amount': 'Amount',
      'search': 'Search',
    };
    return translations[key] || key;
  });

  const mockOnSelectChange = jest.fn();
  const mockOnSelectAllChange = jest.fn();
  const mockOnClearSelection = jest.fn();
  const mockOnSetType = jest.fn();
  const mockOnSetCategoryType = jest.fn();
  const mockOnSplitLoanPayment = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  const createTransaction = (
    id: number,
    type: TransactionType,
    description = 'Test Description'
  ): Transaction => ({
    id,
    externalId: `ext-${id}`,
    status: TransactionStatus.PENDING,
    type,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description,
    transactionDate: new Date('2024-01-01'),
    accountingDate: new Date('2024-01-01'),
    amount: 100,
    balance: 1000,
    propertyId: 1,
  });

  const defaultTransactions: Transaction[] = [
    createTransaction(1, TransactionType.UNKNOWN),
    createTransaction(2, TransactionType.UNKNOWN),
    createTransaction(3, TransactionType.INCOME),
    createTransaction(4, TransactionType.EXPENSE),
  ];

  const defaultProps = {
    t: mockT,
    transactions: defaultTransactions,
    selectedIds: [] as number[],
    selectedTransactionTypes: [] as TransactionType[],
    hasUnknownTypes: true,
    skippedCount: 0,
    onSelectChange: mockOnSelectChange,
    onSelectAllChange: mockOnSelectAllChange,
    onClearSelection: mockOnClearSelection,
    onSetType: mockOnSetType,
    onSetCategoryType: mockOnSetCategoryType,
    onSplitLoanPayment: mockOnSplitLoanPayment,
    onDelete: mockOnDelete,
    onNext: mockOnNext,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders navigation buttons', () => {
      renderWithProviders(<ReviewStep {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      renderWithProviders(<ReviewStep {...defaultProps} />);

      expect(screen.getByText(/Unknown only/)).toBeInTheDocument();
      expect(screen.getByText(/Show all/)).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderWithProviders(<ReviewStep {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  describe('Next button state', () => {
    it('disables Next button when hasUnknownTypes is true', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={true} />);

      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('enables Next button when hasUnknownTypes is false', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={false} />);

      expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    });
  });

  describe('Navigation callbacks', () => {
    it('calls onBack when Back button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ReviewStep {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when Next button is clicked and enabled', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={false} />);

      await user.click(screen.getByRole('button', { name: 'Next' }));

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert messages', () => {
    it('displays skipped rows alert when skippedCount > 0', () => {
      renderWithProviders(<ReviewStep {...defaultProps} skippedCount={5} />);

      expect(screen.getByText('5 transactions were skipped')).toBeInTheDocument();
    });

    it('does not display skipped rows alert when skippedCount is 0', () => {
      renderWithProviders(<ReviewStep {...defaultProps} skippedCount={0} />);

      expect(screen.queryByText(/transactions were skipped/)).not.toBeInTheDocument();
    });

    it('displays unknown types warning when hasUnknownTypes is true', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={true} />);

      expect(screen.getByText('Some transactions have unknown types. Please categorize all transactions before proceeding.')).toBeInTheDocument();
    });

    it('does not display warning when hasUnknownTypes is false', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={false} />);

      expect(screen.queryByText(/unknown types/)).not.toBeInTheDocument();
    });
  });
});
