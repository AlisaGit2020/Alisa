// frontend/src/components/transaction/import-wizard/steps/ReviewStep.test.tsx
import { renderWithProviders, screen } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Transaction, TransactionType, TransactionStatus } from '@asset-types';
import { TFunction } from 'i18next';

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

// Mock AllocationRulesModal
jest.mock(
  '@/components/allocation',
  () => ({
    __esModule: true,
    AllocationRulesModal: () => null,
  }),
  { virtual: true }
);

// Mock AssetToast
jest.mock(
  '@/components/asset/toast/AssetToast',
  () => ({
    __esModule: true,
    default: () => ({
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    }),
  }),
  { virtual: true }
);

// Don't mock AssetDataTable - we want to test actual rendering

// Import ReviewStep after mocks are set up
import ReviewStep from './ReviewStep';

describe('ReviewStep', () => {
  const mockT = jest.fn((key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'importWizard.skippedRows': `${options?.count ?? 0} transactions were skipped`,
      'importWizard.unknownTypesWarning': 'Some transactions have unknown types. Please categorize all transactions before proceeding.',
      'importWizard.allocationRequired': 'You can continue when all transactions are allocated or removed.',
      'importWizard.unknownOnly': 'Not allocated',
      'importWizard.showAll': 'Show all',
      'allocation:allocated': 'Allocated',
      'allocation:rules': 'Allocation Rules',
      'allocation:autoAllocate': 'Auto-Allocate',
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
      'category': 'Category',
    };
    return translations[key] || key;
  }) as unknown as TFunction;

  const mockOnSelectChange = jest.fn();
  const mockOnSelectAllChange = jest.fn();
  const mockOnClearSelection = jest.fn();
  const mockOnSetType = jest.fn();
  const mockOnSetCategoryType = jest.fn();
  const mockOnSplitLoanPayment = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnResetAllocation = jest.fn().mockResolvedValue(undefined);

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
    propertyId: 1,
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
    onResetAllocation: mockOnResetAllocation,
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

      expect(screen.getByText(/Not allocated/)).toBeInTheDocument();
      expect(screen.getByText(/Allocated/)).toBeInTheDocument();
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

    it('displays allocation required info when hasUnknownTypes is true', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={true} />);

      expect(screen.getByText('You can continue when all transactions are allocated or removed.')).toBeInTheDocument();
    });

    it('does not display info when hasUnknownTypes is false', () => {
      renderWithProviders(<ReviewStep {...defaultProps} hasUnknownTypes={false} />);

      expect(screen.queryByText(/all transactions are allocated/)).not.toBeInTheDocument();
    });
  });

  describe('Category name display', () => {
    it('renders Category column header in the data table', () => {
      // Use a simple transaction to ensure the table renders
      const unknownTx = createTransaction(1, TransactionType.UNKNOWN);
      renderWithProviders(
        <ReviewStep {...defaultProps} transactions={[unknownTx]} />
      );

      // Check that the Category column header is rendered
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('displays expense type name for expense transactions', async () => {
      const user = userEvent.setup();
      const expenseTransaction: Transaction = {
        id: 10,
        externalId: 'ext-10',
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
        sender: 'Test Sender',
        receiver: 'Test Receiver',
        description: 'Test expense',
        transactionDate: new Date('2024-01-01'),
        accountingDate: new Date('2024-01-01'),
        amount: -100,
        balance: 900,
        propertyId: 1,
        expenses: [{
          id: 1,
          description: 'Expense',
          amount: 100,
          quantity: 1,
          totalAmount: 100,
          accountingDate: new Date('2024-01-01'),
          expenseType: { id: 1, key: 'maintenance', isTaxDeductible: true, isCapitalImprovement: false },
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 10,
        }],
      };

      renderWithProviders(
        <ReviewStep
          {...defaultProps}
          transactions={[expenseTransaction]}
          hasUnknownTypes={false}
        />
      );

      // Click on "Allocated" toggle button to see allocated transactions
      const allocatedToggle = screen.getByRole('button', { name: /^Allocated \(/i });
      await user.click(allocatedToggle);

      // Verify the expense type name is displayed in the table
      // The translation key is expense-type:maintenance
      expect(screen.getByText('expense-type:maintenance')).toBeInTheDocument();
    });

    it('displays income type name for income transactions', async () => {
      const user = userEvent.setup();
      const incomeTransaction: Transaction = {
        id: 11,
        externalId: 'ext-11',
        status: TransactionStatus.PENDING,
        type: TransactionType.INCOME,
        sender: 'Tenant',
        receiver: 'Owner',
        description: 'Rent payment',
        transactionDate: new Date('2024-01-01'),
        accountingDate: new Date('2024-01-01'),
        amount: 500,
        balance: 1500,
        propertyId: 1,
        incomes: [{
          id: 1,
          description: 'Income',
          amount: 500,
          quantity: 1,
          totalAmount: 500,
          accountingDate: new Date('2024-01-01'),
          incomeType: { id: 1, key: 'rent', isTaxable: true },
          incomeTypeId: 1,
          propertyId: 1,
          transactionId: 11,
        }],
      };

      renderWithProviders(
        <ReviewStep
          {...defaultProps}
          transactions={[incomeTransaction]}
          hasUnknownTypes={false}
        />
      );

      // Click on "Allocated" toggle button
      const allocatedToggle = screen.getByRole('button', { name: /^Allocated \(/i });
      await user.click(allocatedToggle);

      // Verify the income type name is displayed
      expect(screen.getByText('income-type:rent')).toBeInTheDocument();
    });

    it('displays empty cell for transactions without expense/income type', async () => {
      const user = userEvent.setup();
      const allocatedTransaction: Transaction = {
        id: 12,
        externalId: 'ext-12',
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
        sender: 'Test',
        receiver: 'Test',
        description: 'No category',
        transactionDate: new Date('2024-01-01'),
        accountingDate: new Date('2024-01-01'),
        amount: -50,
        balance: 950,
        propertyId: 1,
        // No expenses array
      };

      renderWithProviders(
        <ReviewStep
          {...defaultProps}
          transactions={[allocatedTransaction]}
          hasUnknownTypes={false}
        />
      );

      // Click on "Allocated" toggle
      const allocatedToggle = screen.getByRole('button', { name: /^Allocated \(/i });
      await user.click(allocatedToggle);

      // Verify the transaction row is displayed (by description)
      expect(screen.getByText('No category')).toBeInTheDocument();

      // Verify there's no expense-type or income-type text displayed
      expect(screen.queryByText(/expense-type:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/income-type:/)).not.toBeInTheDocument();
    });

    it('displays empty category when expense exists but has no expenseType object', async () => {
      const user = userEvent.setup();
      // This simulates what happens if the backend returns expenses without expenseType populated
      const expenseWithoutType: Transaction = {
        id: 13,
        externalId: 'ext-13',
        status: TransactionStatus.PENDING,
        type: TransactionType.EXPENSE,
        sender: 'Test',
        receiver: 'Test',
        description: 'Has expense but no type',
        transactionDate: new Date('2024-01-01'),
        accountingDate: new Date('2024-01-01'),
        amount: -75,
        balance: 925,
        propertyId: 1,
        expenses: [{
          id: 1,
          description: 'Expense',
          amount: 75,
          quantity: 1,
          totalAmount: 75,
          accountingDate: new Date('2024-01-01'),
          // expenseType is missing - only expenseTypeId exists
          expenseTypeId: 1,
          propertyId: 1,
          transactionId: 13,
        }],
      };

      renderWithProviders(
        <ReviewStep
          {...defaultProps}
          transactions={[expenseWithoutType]}
          hasUnknownTypes={false}
        />
      );

      // Click on "Allocated" toggle
      const allocatedToggle = screen.getByRole('button', { name: /^Allocated \(/i });
      await user.click(allocatedToggle);

      // Verify the transaction row is displayed
      expect(screen.getByText('Has expense but no type')).toBeInTheDocument();

      // Should NOT have any expense-type text since expenseType object is missing
      expect(screen.queryByText(/expense-type:/)).not.toBeInTheDocument();
    });
  });
});
