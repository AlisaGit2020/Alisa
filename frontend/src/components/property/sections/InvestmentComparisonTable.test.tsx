import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils';
import InvestmentComparisonTable from './InvestmentComparisonTable';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';

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

describe('InvestmentComparisonTable', () => {
  describe('rendering', () => {
    it('renders empty state when no calculations provided', () => {
      renderWithProviders(
        <InvestmentComparisonTable
          calculations={[]}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText(/no calculations/i)).toBeInTheDocument();
    });

    it('renders calculation columns with names as headers', () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Optimistic' }),
        createMockCalculation({ id: 2, name: 'Conservative' }),
      ];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText('Optimistic')).toBeInTheDocument();
      expect(screen.getByText('Conservative')).toBeInTheDocument();
    });

    it('renders input fields section with editable values', () => {
      const calculations = [createMockCalculation({ deptFreePrice: 150000 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should show the input field label
      expect(screen.getByText(/debt-free price/i)).toBeInTheDocument();
      // Should show formatted currency value
      expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
    });

    it('renders calculated results section with read-only values', () => {
      const calculations = [createMockCalculation({ sellingPrice: 150000 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should show the calculated field label
      expect(screen.getByText(/purchase price/i)).toBeInTheDocument();
      // Should show the value (not editable)
      expect(screen.getByText(/150.*000/)).toBeInTheDocument();
    });

    it('renders section sub-headers for field groups', () => {
      const calculations = [createMockCalculation()];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText(/input fields/i)).toBeInTheDocument();
      expect(screen.getByText(/purchase costs/i)).toBeInTheDocument();
      expect(screen.getByText(/loan details/i)).toBeInTheDocument();
      expect(screen.getByText(/income.*expenses/i)).toBeInTheDocument();
      expect(screen.getByText(/returns/i)).toBeInTheDocument();
    });

    it('displays cash flow with positive color when positive', () => {
      const calculations = [createMockCalculation({ id: 1, cashFlowPerMonth: 250 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const cashFlowCell = screen.getByTestId('cashflow-cell-1');
      // Check that the element exists and has a color style applied
      expect(cashFlowCell).toBeInTheDocument();
      // The color is green for positive cash flow (rgb(46, 125, 50) is MUI success color)
      expect(cashFlowCell).toHaveStyle({ color: 'rgb(46, 125, 50)' });
    });

    it('displays cash flow with negative color when negative', () => {
      const calculations = [createMockCalculation({ id: 1, cashFlowPerMonth: -50 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const cashFlowCell = screen.getByTestId('cashflow-cell-1');
      // The color is red for negative cash flow (rgb(211, 47, 47) is MUI error color)
      expect(cashFlowCell).toHaveStyle({ color: 'rgb(211, 47, 47)' });
    });
  });

  describe('inline editing', () => {
    it('allows editing input field values', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      const calculations = [createMockCalculation({ id: 1, deptFreePrice: 150000 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={onUpdate}
          onDelete={jest.fn()}
        />
      );

      // Click on the parent box to make input editable (input has pointer-events: none)
      const input = screen.getByDisplayValue('150000');
      const parentBox = input.closest('.MuiBox-root') as HTMLElement;
      await user.click(parentBox);

      // After clicking, the input becomes editable
      const editableInput = await screen.findByDisplayValue('150000');
      await user.clear(editableInput);
      await user.type(editableInput, '160000');
      await user.tab(); // blur to trigger save

      // Should call onUpdate with the updated value
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            deptFreePrice: 160000,
          })
        );
      });
    });

    it('calls onUpdate when input value changes', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      const calculations = [createMockCalculation({ id: 1, rentPerMonth: 850 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={onUpdate}
          onDelete={jest.fn()}
        />
      );

      // Find the rent input by its value
      const input = screen.getByDisplayValue('850');
      const parentBox = input.closest('.MuiBox-root') as HTMLElement;
      await user.click(parentBox);

      // After clicking, the input becomes editable
      const editableInput = await screen.findByDisplayValue('850');
      await user.clear(editableInput);
      await user.type(editableInput, '900');
      await user.tab();

      // Should call onUpdate with the updated rentPerMonth value
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            rentPerMonth: 900,
          })
        );
      });
    });

    it('does not allow editing calculated output fields', () => {
      const calculations = [createMockCalculation()];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Get a calculated field cell (sellingPrice)
      const calculatedCell = screen.getByTestId('output-sellingPrice-1');
      const input = within(calculatedCell).queryByRole('textbox');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('renders delete button for each calculation column', () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Test 1' }),
        createMockCalculation({ id: 2, name: 'Test 2' }),
      ];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      const calculations = [createMockCalculation({ id: 1, name: 'Test Calc' })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion in dialog
      const confirmButton = await screen.findByRole('button', { name: /confirm|yes/i });
      await user.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      const calculations = [createMockCalculation({ id: 1, name: 'Test Calc' })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Cancel deletion in dialog
      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('responsive behavior', () => {
    it('renders first column as sticky for labels', () => {
      const calculations = [createMockCalculation()];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const labelColumn = screen.getByTestId('label-column');
      expect(labelColumn).toHaveStyle({ position: 'sticky' });
    });
  });
});
