// frontend/src/components/transaction/import-wizard/steps/AcceptStep.test.tsx
import { renderWithProviders, screen, waitFor } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AcceptStep from './AcceptStep';
import { Transaction, TransactionType, TransactionStatus } from '@asset-types';
import { TFunction } from 'i18next';

describe('AcceptStep', () => {
  const mockT = jest.fn((key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'importWizard.readyToApprove': 'Ready to Approve',
      'importWizard.transactionCount': `${options?.count ?? 0} transactions are ready to be approved`,
      'importWizard.breakdown': 'Breakdown by type',
      'importWizard.transactions': 'transactions',
      'importWizard.total': 'Total',
      'importWizard.back': 'Back',
      'importWizard.approving': 'Approving...',
      'importWizard.approveAll': 'Approve All',
      'income': 'Income',
      'expense': 'Expense',
      'deposit': 'Deposit',
      'withdraw': 'Withdraw',
      'unknown': 'Unknown',
    };
    return translations[key] || key;
  }) as unknown as TFunction;

  const mockOnApprove = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  const createTransaction = (
    id: number,
    type: TransactionType,
    amount: number
  ): Transaction => ({
    id,
    externalId: `ext-${id}`,
    status: TransactionStatus.PENDING,
    type,
    sender: 'Test Sender',
    receiver: 'Test Receiver',
    description: 'Test Description',
    transactionDate: new Date('2024-01-01'),
    accountingDate: new Date('2024-01-01'),
    amount,
    balance: 1000,
    propertyId: 1,
  });

  const defaultTransactions: Transaction[] = [
    createTransaction(1, TransactionType.INCOME, 1000),
    createTransaction(2, TransactionType.INCOME, 500),
    createTransaction(3, TransactionType.EXPENSE, -300),
    createTransaction(4, TransactionType.EXPENSE, -200),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the ready to approve message', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Ready to Approve')).toBeInTheDocument();
    });

    it('displays transaction count', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('4 transactions are ready to be approved')).toBeInTheDocument();
    });

    it('displays breakdown by type', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Breakdown by type')).toBeInTheDocument();
    });

    it('shows transaction counts per type', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // 2 income transactions, 2 expense transactions - use getAllByText since there are multiple
      const transactionCounts = screen.getAllByText('2 transactions');
      expect(transactionCounts).toHaveLength(2); // One for income, one for expense
    });

    it('displays total amount', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve All' })).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator when approving', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={true}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('button', { name: 'Approving...' })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables buttons when approving', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={true}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Approving...' })).toBeDisabled();
    });
  });

  describe('Error state', () => {
    it('displays error message when approveError is set', () => {
      const errorMessage = 'Failed to approve transactions';

      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={errorMessage}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('calls onBack when Back button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onApprove and onNext when Approve All succeeds', async () => {
      const user = userEvent.setup();
      mockOnApprove.mockResolvedValue(true);

      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Approve All' }));

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledTimes(1);
        expect(mockOnNext).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onNext when Approve All fails', async () => {
      const user = userEvent.setup();
      mockOnApprove.mockResolvedValue(false);

      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={defaultTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Approve All' }));

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledTimes(1);
        expect(mockOnNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty transactions array', () => {
      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={[]}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('0 transactions are ready to be approved')).toBeInTheDocument();
    });

    it('handles all transaction types', () => {
      const allTypesTransactions: Transaction[] = [
        createTransaction(1, TransactionType.INCOME, 1000),
        createTransaction(2, TransactionType.EXPENSE, -500),
        createTransaction(3, TransactionType.DEPOSIT, 2000),
        createTransaction(4, TransactionType.WITHDRAW, -300),
        createTransaction(5, TransactionType.UNKNOWN, 100),
      ];

      renderWithProviders(
        <AcceptStep
          t={mockT}
          transactions={allTypesTransactions}
          isApproving={false}
          approveError={null}
          onApprove={mockOnApprove}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('5 transactions are ready to be approved')).toBeInTheDocument();
    });
  });
});
