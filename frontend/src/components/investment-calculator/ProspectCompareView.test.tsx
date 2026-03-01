import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';
import { PropertyStatus } from '@asset-types/common';
import ProspectCompareView from './ProspectCompareView';

// Helper to create mock calculation
const createMockCalculation = (overrides: object = {}) => ({
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
  propertyId: null,
  property: null,
  ...overrides,
});

// Helper to create mock property
const createMockProperty = (overrides: object = {}) => ({
  id: 1,
  name: 'Helsinki Apartment',
  size: 55,
  status: PropertyStatus.PROSPECT,
  photo: '/uploads/properties/test.jpg',
  address: {
    id: 1,
    street: 'Mannerheimintie 1',
    city: 'Helsinki',
    postalCode: '00100',
  },
  ...overrides,
});

describe('ProspectCompareView', () => {
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, 'search');
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching calculations', async () => {
      mockSearch.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ProspectCompareView />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when API returns error', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no calculations exist', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        // Translation is 'No saved calculations' from investment-calculator namespace
        expect(screen.getByText(/no saved calculations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Displaying Calculations', () => {
    it('fetches calculations on mount', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            relations: { property: { address: true } },
          })
        );
      });
    });

    it('displays calculations in list', async () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Investment A' }),
        createMockCalculation({ id: 2, name: 'Investment B' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Investment A')).toBeInTheDocument();
      });
      expect(screen.getByText('Investment B')).toBeInTheDocument();
    });

    it('groups calculations by property', async () => {
      const property1 = createMockProperty({ id: 1, name: 'Test Property' });

      const calculations = [
        createMockCalculation({ id: 1, name: 'Linked Calc', propertyId: 1, property: property1 }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      // Wait for loading to complete and calculations to display
      // Display format is "Street - Calculation Name"
      await waitFor(() => {
        expect(screen.getByText('Mannerheimintie 1 - Linked Calc')).toBeInTheDocument();
      });

      // Property name should appear in the group header
      expect(screen.getAllByText('Test Property').length).toBeGreaterThan(0);
    });

    it('shows unlinked section for calculations without property', async () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Unlinked Calc', propertyId: null, property: null }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Unlinked Calc')).toBeInTheDocument();
      });
    });
  });

  describe('Selection and Comparison', () => {
    it('selecting a calculation adds it to comparison', async () => {
      const user = userEvent.setup();
      const calculations = [
        createMockCalculation({ id: 1, name: 'Selectable Calc' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Selectable Calc')).toBeInTheDocument();
      });

      // Click on the calculation to select it
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // Calculation should now appear in the comparison zone (multiple times - in chip and table)
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      expect(within(comparisonZone).getAllByText('Selectable Calc').length).toBeGreaterThan(0);
    });

    it('can remove calculation from comparison', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ id: 1, name: 'Removable Calc' })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Removable Calc')).toBeInTheDocument();
      });

      // Add to comparison
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // Verify it's in comparison
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      expect(within(comparisonZone).getAllByText('Removable Calc').length).toBeGreaterThan(0);

      // Find the CloseIcon (used by Chip onDelete) and click it
      const closeIcons = within(comparisonZone).getAllByTestId('CloseIcon');
      expect(closeIcons.length).toBeGreaterThan(0);
      await user.click(closeIcons[0]);

      // Should no longer be in comparison - check for empty state placeholder
      await waitFor(() => {
        expect(within(comparisonZone).queryByText(/click to add to comparison/i)).toBeInTheDocument();
      });
    });
  });

  describe('Layout', () => {
    it('renders two-panel layout', async () => {
      mockSearch.mockResolvedValue([createMockCalculation()]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
      });
      expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
    });
  });
});
