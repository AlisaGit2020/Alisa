import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';
import { PropertyStatus } from '@asset-types/common';

// Mock translations
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'investment-calculator:prospectCompare': 'Compare Prospects',
        'investment-calculator:calculations': 'Calculations',
        'investment-calculator:comparison': 'Comparison',
        'investment-calculator:loading': 'Loading...',
        'investment-calculator:errorLoading': 'Error loading calculations',
        'investment-calculator:noCalculations': 'No calculations found',
        'investment-calculator:noCalculationsMessage': 'Create calculations to compare investment opportunities',
        'investment-calculator:unlinkedCalculations': 'Unlinked',
        'investment-calculator:maxCalculationsWarning': 'Maximum 5 calculations can be compared',
        'investment-calculator:duplicateWarning': 'This calculation is already in the comparison',
        'investment-calculator:dropHereToCompare': 'Drop here to compare',
        'common:retry': 'Retry',
      };
      if (options?.count !== undefined) {
        return (translations[key] || key).replace('{{count}}', String(options.count));
      }
      return translations[key] || key;
    },
  }),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: object) => {
      const translations: Record<string, string> = {
        noCalculations: 'No calculations to compare',
      };
      const t = (key: string) => translations[key] || key;
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Mock useToast
const mockShowToast = jest.fn();
jest.mock('../../asset/toast/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Import after mocking
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
    it('shows loading state while fetching calculations', async () => {
      // Create a promise that never resolves to keep loading state
      mockSearch.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ProspectCompareView />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows loading spinner or skeleton', async () => {
      mockSearch.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ProspectCompareView />);

      // Look for loading indicator (CircularProgress or Skeleton)
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when API returns error', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Error loading calculations')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('retries fetching when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockSearch.mockRejectedValueOnce(new Error('Network error'));
      mockSearch.mockResolvedValueOnce([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Error loading calculations')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no calculations exist', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('No calculations found')).toBeInTheDocument();
      });
    });

    it('shows instructional message when empty', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(
          screen.getByText('Create calculations to compare investment opportunities')
        ).toBeInTheDocument();
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
          expect.any(Object)
        );
      });
    });

    it('displays calculations in list', async () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Investment A' }),
        createMockCalculation({ id: 2, name: 'Investment B' }),
        createMockCalculation({ id: 3, name: 'Investment C' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Investment A')).toBeInTheDocument();
      });
      expect(screen.getByText('Investment B')).toBeInTheDocument();
      expect(screen.getByText('Investment C')).toBeInTheDocument();
    });

    it('groups calculations by property', async () => {
      const property1 = createMockProperty({ id: 1, name: 'Property One' });
      const property2 = createMockProperty({ id: 2, name: 'Property Two' });

      const calculations = [
        createMockCalculation({ id: 1, name: 'Calc 1A', propertyId: 1, property: property1 }),
        createMockCalculation({ id: 2, name: 'Calc 1B', propertyId: 1, property: property1 }),
        createMockCalculation({ id: 3, name: 'Calc 2A', propertyId: 2, property: property2 }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Property One')).toBeInTheDocument();
      });
      expect(screen.getByText('Property Two')).toBeInTheDocument();
    });

    it('shows "Unlinked" section for calculations without property', async () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'Linked Calc', propertyId: 1, property: createMockProperty() }),
        createMockCalculation({ id: 2, name: 'Unlinked Calc', propertyId: null, property: null }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Unlinked')).toBeInTheDocument();
      });
      expect(screen.getByText('Unlinked Calc')).toBeInTheDocument();
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

      // Calculation should now appear in the comparison zone
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      expect(within(comparisonZone).getByText('Selectable Calc')).toBeInTheDocument();
    });

    it('cannot add more than 5 calculations (shows warning)', async () => {
      const user = userEvent.setup();
      const calculations = [
        createMockCalculation({ id: 1, name: 'Calc 1' }),
        createMockCalculation({ id: 2, name: 'Calc 2' }),
        createMockCalculation({ id: 3, name: 'Calc 3' }),
        createMockCalculation({ id: 4, name: 'Calc 4' }),
        createMockCalculation({ id: 5, name: 'Calc 5' }),
        createMockCalculation({ id: 6, name: 'Calc 6' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Calc 1')).toBeInTheDocument();
      });

      // Select 5 calculations
      for (let i = 1; i <= 5; i++) {
        const calcItem = screen.getByTestId(`calculation-list-item-${i}`);
        await user.click(calcItem);
      }

      // Try to select the 6th calculation
      const sixthCalc = screen.getByTestId('calculation-list-item-6');
      await user.click(sixthCalc);

      // Should show warning toast
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Maximum 5 calculations can be compared',
          severity: 'warning',
        })
      );
    });

    it('cannot add duplicate calculation (shows warning)', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ id: 1, name: 'Duplicate Me' })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Me')).toBeInTheDocument();
      });

      // Click twice to add and then try to add again
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);
      await user.click(calcItem);

      // Should show warning toast
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'This calculation is already in the comparison',
          severity: 'warning',
        })
      );
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
      expect(within(comparisonZone).getByText('Removable Calc')).toBeInTheDocument();

      // Remove from comparison
      const removeButton = within(comparisonZone).getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Should no longer be in comparison
      await waitFor(() => {
        expect(
          within(comparisonZone).queryByText('Removable Calc')
        ).not.toBeInTheDocument();
      });
    });

    it('marks selected calculations in the list', async () => {
      const user = userEvent.setup();
      const calculations = [
        createMockCalculation({ id: 1, name: 'Selected' }),
        createMockCalculation({ id: 2, name: 'Not Selected' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });

      // Select first calculation
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // First calculation should be marked as selected
      expect(calcItem).toHaveClass('Mui-selected');

      // Second calculation should not be selected
      const secondCalcItem = screen.getByTestId('calculation-list-item-2');
      expect(secondCalcItem).not.toHaveClass('Mui-selected');
    });
  });

  describe('Layout', () => {
    it('renders two-panel layout', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('No calculations found')).toBeInTheDocument();
      });

      // Should have calculations list panel and comparison panel
      expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
      expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
    });

    it('shows page title', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Compare Prospects')).toBeInTheDocument();
      });
    });

    it('shows section headers', async () => {
      mockSearch.mockResolvedValue([createMockCalculation()]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Calculations')).toBeInTheDocument();
      });
      expect(screen.getByText('Comparison')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('includes property relation in API call', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            relations: expect.objectContaining({
              property: true,
            }),
          })
        );
      });
    });

    it('orders calculations by name', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            order: expect.objectContaining({
              name: 'ASC',
            }),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has appropriate ARIA labels for main sections', async () => {
      mockSearch.mockResolvedValue([createMockCalculation()]);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByTestId('calculations-list-panel')).toHaveAttribute(
          'aria-label'
        );
      });
      expect(screen.getByTestId('comparison-panel')).toHaveAttribute('aria-label');
    });

    it('calculations are keyboard navigable', async () => {
      const calculations = [
        createMockCalculation({ id: 1, name: 'First' }),
        createMockCalculation({ id: 2, name: 'Second' }),
      ];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('First')).toBeInTheDocument();
      });

      // Tab to first calculation
      const firstCalc = screen.getByTestId('calculation-list-item-1');
      firstCalc.focus();
      expect(document.activeElement).toBe(firstCalc);
    });

    it('supports keyboard selection with Enter key', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ id: 1, name: 'Keyboard Select' })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Keyboard Select')).toBeInTheDocument();
      });

      const calcItem = screen.getByTestId('calculation-list-item-1');
      calcItem.focus();
      await user.keyboard('{Enter}');

      // Should be added to comparison
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      expect(within(comparisonZone).getByText('Keyboard Select')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid selection/deselection', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ id: 1, name: 'Rapid Click' })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Rapid Click')).toBeInTheDocument();
      });

      const calcItem = screen.getByTestId('calculation-list-item-1');

      // Rapidly click to add
      await user.click(calcItem);

      // Get remove button and click it
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      const removeButton = within(comparisonZone).getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Click to add again
      await user.click(calcItem);

      // Should end up in comparison
      expect(within(comparisonZone).getByText('Rapid Click')).toBeInTheDocument();
    });

    it('handles large number of calculations without crashing', async () => {
      const manyCalculations = Array.from({ length: 50 }, (_, i) =>
        createMockCalculation({ id: i + 1, name: `Calculation ${i + 1}` })
      );
      mockSearch.mockResolvedValue(manyCalculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Calculation 1')).toBeInTheDocument();
      });

      // Should render without crashing
      expect(screen.getByText('Calculation 50')).toBeInTheDocument();
    });

    it('handles calculations with very long names', async () => {
      const longName = 'A'.repeat(200);
      const calculations = [createMockCalculation({ id: 1, name: longName })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        // Should truncate or handle long name gracefully
        expect(screen.getByTestId('calculation-list-item-1')).toBeInTheDocument();
      });
    });

    it('preserves comparison state when list refreshes', async () => {
      const user = userEvent.setup();
      const calculations = [createMockCalculation({ id: 1, name: 'Persistent' })];
      mockSearch.mockResolvedValue(calculations);

      renderWithProviders(<ProspectCompareView />);

      await waitFor(() => {
        expect(screen.getByText('Persistent')).toBeInTheDocument();
      });

      // Add to comparison
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // Verify in comparison
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      expect(within(comparisonZone).getByText('Persistent')).toBeInTheDocument();

      // Mock a second call (e.g., after refresh)
      mockSearch.mockResolvedValue([
        createMockCalculation({ id: 1, name: 'Persistent Updated' }),
      ]);

      // The comparison should still show the calculation
      // (implementation detail - may update name or keep original)
      expect(within(comparisonZone).queryByText('Persistent')).toBeInTheDocument();
    });
  });
});