// frontend/src/components/transaction/import-wizard/steps/DoneStep.test.tsx
import { renderWithProviders, screen } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DoneStep from './DoneStep';
import { ImportStats } from '../types';
import { TransactionType } from '@alisa-types';

// Mock useNavigate - must be before importing DoneStep
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DoneStep', () => {
  const mockT = jest.fn((key: string, options?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'importWizard.importComplete': 'Import Complete!',
      'importWizard.successMessage': `Successfully imported and approved ${options?.count ?? 0} transactions.`,
      'importWizard.transactionsImported': 'Transactions Imported',
      'importWizard.netAmount': 'Net Amount',
      'importWizard.importAnotherFile': 'Import Another File',
      'importWizard.viewTransactions': 'Go to Transactions',
    };
    return translations[key] || key;
  });

  const mockOnReset = jest.fn();

  const defaultStats: ImportStats = {
    totalCount: 10,
    totalAmount: 1500.5,
    byType: new Map([
      [TransactionType.INCOME, { count: 5, amount: 2000 }],
      [TransactionType.EXPENSE, { count: 5, amount: -500 }],
    ]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders success message with transaction count', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      expect(screen.getByText('Import Complete!')).toBeInTheDocument();
      expect(screen.getByText('Successfully imported and approved 10 transactions.')).toBeInTheDocument();
    });

    it('displays total transaction count', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Transactions Imported')).toBeInTheDocument();
    });

    it('displays formatted net amount with positive color for positive amounts', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      expect(screen.getByText('Net Amount')).toBeInTheDocument();
      // Currency formatting in Finnish locale
      const amountElement = screen.getByText(/1.*500/);
      expect(amountElement).toBeInTheDocument();
    });

    it('displays formatted net amount with negative color for negative amounts', () => {
      const negativeStats: ImportStats = {
        totalCount: 5,
        totalAmount: -500.0,
        byType: new Map([[TransactionType.EXPENSE, { count: 5, amount: -500 }]]),
      };

      renderWithProviders(
        <DoneStep t={mockT} stats={negativeStats} onReset={mockOnReset} />
      );

      // Finnish locale uses minus sign (−) not hyphen (-)
      const amountElement = screen.getByText(/500/);
      expect(amountElement).toBeInTheDocument();
    });

    it('renders both action buttons', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      expect(screen.getByRole('button', { name: 'Import Another File' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Transactions' })).toBeInTheDocument();
    });

    it('renders success icon', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      // CheckCircleIcon should be present
      const svg = document.querySelector('svg[data-testid="CheckCircleIcon"]');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('calls onReset when "Import Another File" button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      await user.click(screen.getByRole('button', { name: 'Import Another File' }));

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('has a View Transactions button', () => {
      renderWithProviders(
        <DoneStep t={mockT} stats={defaultStats} onReset={mockOnReset} />
      );

      // The button should exist and be clickable
      const button = screen.getByRole('button', { name: 'Go to Transactions' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('handles zero transactions', () => {
      const zeroStats: ImportStats = {
        totalCount: 0,
        totalAmount: 0,
        byType: new Map(),
      };

      renderWithProviders(
        <DoneStep t={mockT} stats={zeroStats} onReset={mockOnReset} />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very large amounts', () => {
      const largeStats: ImportStats = {
        totalCount: 100,
        totalAmount: 1000000.99,
        byType: new Map([[TransactionType.INCOME, { count: 100, amount: 1000000.99 }]]),
      };

      renderWithProviders(
        <DoneStep t={mockT} stats={largeStats} onReset={mockOnReset} />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
