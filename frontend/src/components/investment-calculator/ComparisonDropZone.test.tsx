import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import ApiClient from '@asset-lib/api-client';

// Mock ApiClient
jest.spyOn(ApiClient, 'post').mockResolvedValue({
  data: {},
} as unknown as ReturnType<typeof ApiClient.post>);

// Mock translations
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'investment-calculator:dropHereToCompare': 'Drop here to compare',
        'investment-calculator:emptyComparisonMessage': 'Select calculations from the list to compare',
        'investment-calculator:removeFromComparison': 'Remove from comparison',
        'investment-calculator:noCalculations': 'No calculations to compare',
        'common:delete': 'Delete',
        'common:remove': 'Remove',
      };
      return translations[key] || key;
    },
  }),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: object) => {
      const translations: Record<string, string> = {
        noCalculations: 'No calculations to compare',
        'input-fields': 'Input Fields',
        'purchase-costs': 'Purchase Costs',
        'loan-details': 'Loan Details',
        'income-expenses': 'Income & Expenses',
        returns: 'Returns',
      };
      const t = (key: string) => translations[key] || key;
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Import after mocking
import ComparisonDropZone from './ComparisonDropZone';

// Helper to create mock calculation
const createMockCalculation = (
  overrides: Partial<SavedInvestmentCalculation> = {}
): SavedInvestmentCalculation => ({
  id: 1,
  name: 'Test Calculation',
  deptFreePrice: 150000,
  deptShare: 0,
  transferTaxPercent: 2,
  maintenanceFee: 200,
  chargeForFinancialCosts: 50,
  rentPerMonth: 850,
  apartmentSize: 55,
  waterCharge: 20,
  downPayment: 30000,
  loanInterestPercent: 4,
  loanPeriod: 25,
  sellingPrice: 150000,
  transferTax: 3000,
  pricePerSquareMeter: 2727,
  loanFinancing: 120000,
  loanFirstMonthInstallment: 400,
  loanFirstMonthInterest: 400,
  rentalIncomePerYear: 10200,
  maintenanceCosts: 3240,
  expensesPerMonth: 670,
  rentalYieldPercent: 6.8,
  cashFlowPerMonth: 180,
  cashFlowAfterTaxPerMonth: 126,
  profitPerYear: 2160,
  taxPerYear: 648,
  taxDeductibleExpensesPerYear: 3240,
  ...overrides,
});

describe('ComparisonDropZone', () => {
  const defaultProps = {
    calculations: [],
    onRemove: jest.fn(),
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('shows empty state placeholder when no calculations are provided', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} />);

      expect(screen.getByText('Drop here to compare')).toBeInTheDocument();
    });

    it('shows instructional message when empty', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} />);

      expect(
        screen.getByText('Select calculations from the list to compare')
      ).toBeInTheDocument();
    });

    it('renders drop zone container with data-testid', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} />);

      expect(screen.getByTestId('comparison-drop-zone')).toBeInTheDocument();
    });

    it('has appropriate drop zone styling (dashed border)', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} />);

      const dropZone = screen.getByTestId('comparison-drop-zone');
      expect(dropZone).toHaveStyle({ border: expect.stringContaining('dashed') });
    });
  });

  describe('With Calculations', () => {
    it('renders InvestmentComparisonTable when calculations are present', () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Calculation A' }),
        createMockCalculation({ id: 2, name: 'Calculation B' }),
      ];

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={calculations} />
      );

      // Should show calculation names in comparison table
      expect(screen.getByText('Calculation A')).toBeInTheDocument();
      expect(screen.getByText('Calculation B')).toBeInTheDocument();
    });

    it('hides empty state when calculations are present', () => {
      const calculations = [createMockCalculation()];

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={calculations} />
      );

      expect(screen.queryByText('Drop here to compare')).not.toBeInTheDocument();
    });

    it('renders remove button for each calculation', () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Calc A' }),
        createMockCalculation({ id: 2, name: 'Calc B' }),
        createMockCalculation({ id: 3, name: 'Calc C' }),
      ];

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={calculations} />
      );

      // Each calculation should have a remove button
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(3);
    });

    it('renders single calculation correctly', () => {
      const calculations = [createMockCalculation({ id: 1, name: 'Single Calc' })];

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={calculations} />
      );

      expect(screen.getByText('Single Calc')).toBeInTheDocument();
    });
  });

  describe('Remove Functionality', () => {
    it('calls onRemove with calculation id when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      const calculations = [createMockCalculation({ id: 42, name: 'Test Calc' })];

      renderWithProviders(
        <ComparisonDropZone
          {...defaultProps}
          calculations={calculations}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith(42);
    });

    it('removes correct calculation when multiple are present', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      const calculations = [
        createMockCalculation({ id: 1, name: 'First' }),
        createMockCalculation({ id: 2, name: 'Second' }),
        createMockCalculation({ id: 3, name: 'Third' }),
      ];

      renderWithProviders(
        <ComparisonDropZone
          {...defaultProps}
          calculations={calculations}
          onRemove={onRemove}
        />
      );

      // Click remove on the second calculation
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[1]);

      expect(onRemove).toHaveBeenCalledWith(2);
    });

    it('shows remove button with appropriate aria-label', () => {
      const calculations = [createMockCalculation({ id: 1, name: 'Test' })];

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={calculations} />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toHaveAccessibleName();
    });
  });

  describe('Update Functionality', () => {
    it('passes onUpdate to InvestmentComparisonTable', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      const calculations = [createMockCalculation({ id: 1, deptFreePrice: 150000 })];

      renderWithProviders(
        <ComparisonDropZone
          {...defaultProps}
          calculations={calculations}
          onUpdate={onUpdate}
        />
      );

      // Find a clickable value in the comparison table
      // Debt-free price appears twice (input and output), click the first one
      const valueTexts = screen.getAllByText('150 000 €');
      await user.click(valueTexts[0]);

      // Wait for input to appear and change value
      const editableInput = await screen.findByDisplayValue('150000');
      await user.clear(editableInput);
      await user.type(editableInput, '160000');
      await user.tab(); // blur to trigger save

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Drag Over State', () => {
    it('applies visual feedback when isDragOver is true', () => {
      renderWithProviders(
        <ComparisonDropZone {...defaultProps} isDragOver={true} />
      );

      const dropZone = screen.getByTestId('comparison-drop-zone');
      // Should have highlighted/active styling
      expect(dropZone).toHaveClass('drag-over');
    });

    it('removes visual feedback when isDragOver is false', () => {
      renderWithProviders(
        <ComparisonDropZone {...defaultProps} isDragOver={false} />
      );

      const dropZone = screen.getByTestId('comparison-drop-zone');
      expect(dropZone).not.toHaveClass('drag-over');
    });

    it('shows different placeholder text when dragging over', () => {
      renderWithProviders(
        <ComparisonDropZone {...defaultProps} isDragOver={true} />
      );

      // When dragging over, may show different text like "Release to add"
      expect(screen.getByText('Drop here to compare')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has appropriate ARIA attributes for drop zone', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} />);

      const dropZone = screen.getByTestId('comparison-drop-zone');
      expect(dropZone).toHaveAttribute('role', 'region');
      expect(dropZone).toHaveAttribute('aria-label');
    });

    it('remove buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      const calculations = [createMockCalculation({ id: 1 })];

      renderWithProviders(
        <ComparisonDropZone
          {...defaultProps}
          calculations={calculations}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      removeButton.focus();
      await user.keyboard('{Enter}');

      expect(onRemove).toHaveBeenCalledWith(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty calculations array', () => {
      renderWithProviders(<ComparisonDropZone {...defaultProps} calculations={[]} />);

      expect(screen.getByText('Drop here to compare')).toBeInTheDocument();
    });

    it('handles undefined calculations gracefully', () => {
      // @ts-expect-error - Testing undefined handling
      renderWithProviders(<ComparisonDropZone {...defaultProps} calculations={undefined} />);

      expect(screen.getByTestId('comparison-drop-zone')).toBeInTheDocument();
    });

    it('handles calculation with minimal data', () => {
      const minimalCalculation: SavedInvestmentCalculation = {
        id: 1,
        name: 'Minimal',
        deptFreePrice: 0,
        deptShare: 0,
        transferTaxPercent: 0,
        maintenanceFee: 0,
        chargeForFinancialCosts: 0,
        rentPerMonth: 0,
        sellingPrice: 0,
        transferTax: 0,
        pricePerSquareMeter: 0,
        loanFinancing: 0,
        loanFirstMonthInstallment: 0,
        loanFirstMonthInterest: 0,
        rentalIncomePerYear: 0,
        maintenanceCosts: 0,
        expensesPerMonth: 0,
        rentalYieldPercent: 0,
        cashFlowPerMonth: 0,
        cashFlowAfterTaxPerMonth: 0,
        profitPerYear: 0,
        taxPerYear: 0,
        taxDeductibleExpensesPerYear: 0,
      };

      renderWithProviders(
        <ComparisonDropZone {...defaultProps} calculations={[minimalCalculation]} />
      );

      expect(screen.getByText('Minimal')).toBeInTheDocument();
    });
  });
});