import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils';
import InvestmentComparisonTable from './InvestmentComparisonTable';
import { SavedInvestmentCalculation } from '../../investment-calculator/InvestmentCalculatorResults';
import { PropertyStatus } from '@asset-types';
import ApiClient from '@asset-lib/api-client';

// Mock ApiClient
jest.spyOn(ApiClient, 'post').mockResolvedValue({
  data: {},
} as unknown as ReturnType<typeof ApiClient.post>);

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

    it('renders input fields section with editable values displayed as text', () => {
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
      // Should show formatted currency value as text (displayed twice - input and output have same value)
      const valueElements = screen.getAllByText('150 000 €');
      expect(valueElements.length).toBeGreaterThanOrEqual(1);
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
      // Should show the value (not editable) with data-testid
      expect(screen.getByTestId('output-sellingPrice-1')).toHaveTextContent('150 000 €');
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

      // Click on the text value to make input editable
      const valueTexts = screen.getAllByText('150 000 €');
      // First one should be the input field (deptFreePrice), second is the output (sellingPrice)
      await user.click(valueTexts[0]);

      // After clicking, an input becomes editable
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

      // Find the rent value as text
      const rentText = screen.getByText('850 €');
      await user.click(rentText);

      // After clicking, an input becomes editable
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

  describe('input field display', () => {
    it('displays input values as text when not editing (not as TextField)', () => {
      const calculations = [createMockCalculation({ deptFreePrice: 150000 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should display as formatted text, not as a TextField input
      // deptFreePrice appears once as input and once as sellingPrice output
      const valueElements = screen.getAllByText('150 000 €');
      expect(valueElements.length).toBeGreaterThanOrEqual(1);
      // Should NOT have a visible input until clicked
      expect(screen.queryByDisplayValue('150000')).not.toBeInTheDocument();
    });

    it('shows input field only after clicking on value', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ deptFreePrice: 150000 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Click on the first text value (input field)
      const valueTexts = screen.getAllByText('150 000 €');
      await user.click(valueTexts[0]);

      // Now input should appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
      });
    });
  });

  describe('field formatting', () => {
    it('displays loanPeriod in years, not currency', () => {
      const calculations = [createMockCalculation({ id: 1, loanPeriod: 25 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should display "25 yrs" (years), NOT "25 €"
      expect(screen.getByText('25 yrs')).toBeInTheDocument();
      expect(screen.queryByText('25 €')).not.toBeInTheDocument();
    });
  });

  describe('header display with property', () => {
    it('displays street name with calculation name when property is linked', () => {
      const calcWithProperty = {
        ...createMockCalculation({ id: 1, name: 'Laskelma 1' }),
        property: {
          id: 1,
          name: 'Test Property',
          size: 55,
          status: PropertyStatus.PROSPECT,
          address: {
            id: 1,
            street: 'Kauppapuistikko 45',
            city: 'Vaasa',
            postalCode: '65100',
          },
        },
      };

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={[calcWithProperty]}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should show "Kauppapuistikko 45 - Laskelma 1" in header
      expect(screen.getByText('Kauppapuistikko 45 - Laskelma 1')).toBeInTheDocument();
    });

    it('displays only calculation name when property is not linked', () => {
      const calculations = [createMockCalculation({ id: 1, name: 'Standalone Calc' })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Should show just the calculation name
      expect(screen.getByText('Standalone Calc')).toBeInTheDocument();
    });
  });

  describe('table styling', () => {
    it('does not have hover effect on table rows', () => {
      const calculations = [createMockCalculation()];

      const { container } = renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // TableRow elements should not have the hover class
      const tableRows = container.querySelectorAll('tr.MuiTableRow-hover');
      expect(tableRows).toHaveLength(0);
    });

    it('aligns calculation column values to the right', () => {
      const calculations = [createMockCalculation({ id: 1 })];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Get output cells and verify they are right-aligned
      const outputCell = screen.getByTestId('output-sellingPrice-1').closest('td');
      expect(outputCell).toHaveStyle({ textAlign: 'right' });
    });

    it('aligns calculation column headers to the right', () => {
      const calculations = [createMockCalculation({ id: 1, name: 'Test Calc' })];

      const { container } = renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // Get the header cell for calculation column (not the first label column)
      const headerCells = container.querySelectorAll('thead th');
      const calculationHeaderCell = headerCells[1]; // Second header cell is the calculation column
      expect(calculationHeaderCell).toHaveStyle({ textAlign: 'right' });
    });

    it('first column header is empty (no text)', () => {
      const calculations = [createMockCalculation()];

      renderWithProviders(
        <InvestmentComparisonTable
          calculations={calculations}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // First column header should be empty
      const labelColumn = screen.getByTestId('label-column');
      expect(labelColumn).toBeEmptyDOMElement();
    });
  });
});
