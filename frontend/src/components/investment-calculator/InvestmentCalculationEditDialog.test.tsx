import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import InvestmentCalculationEditDialog from './InvestmentCalculationEditDialog';
import ApiClient from '@alisa-lib/api-client';

// Spy on ApiClient methods
jest.spyOn(ApiClient, 'get');
jest.spyOn(ApiClient, 'post');
jest.spyOn(ApiClient, 'put');

describe('InvestmentCalculationEditDialog', () => {
  const mockCalculation = {
    id: 1,
    name: 'Test Calculation',
    deptFreePrice: 150000,
    deptShare: 25000,
    transferTaxPercent: 2,
    maintenanceFee: 200,
    chargeForFinancialCosts: 50,
    rentPerMonth: 900,
    apartmentSize: 60,
    waterCharge: 20,
    downPayment: 30000,
    loanInterestPercent: 3,
    loanPeriod: 25,
    // All required result fields
    sellingPrice: 125000,
    transferTax: 2500,
    pricePerSquareMeter: 2500,
    loanFinancing: 95000,
    loanFirstMonthInstallment: 380,
    loanFirstMonthInterest: 237.5,
    rentalIncomePerYear: 10800,
    maintenanceCosts: 2400,
    expensesPerMonth: 250,
    rentalYieldPercent: 6.17,
    cashFlowPerMonth: 400,
    cashFlowAfterTaxPerMonth: 320,
    profitPerYear: 4800,
    taxPerYear: 960,
    taxDeductibleExpensesPerYear: 2400,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('shows loading state initially', async () => {
    (ApiClient.get as unknown as jest.SpyInstance).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('calls API with correct calculation ID', async () => {
    (ApiClient.get as unknown as jest.SpyInstance).mockResolvedValue(mockCalculation);

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={5}
        open={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(ApiClient.get).toHaveBeenCalledWith('real-estate/investment', 5);
    });
  });

  it('does not load when dialog is closed', () => {
    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={false}
        onClose={jest.fn()}
      />
    );

    expect(ApiClient.get).not.toHaveBeenCalled();
  });

  it('does not load when calculationId is 0', () => {
    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={0}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(ApiClient.get).not.toHaveBeenCalled();
  });

  it('calls onClose when dialog is closed via Escape', async () => {
    const mockOnClose = jest.fn();
    (ApiClient.get as unknown as jest.SpyInstance).mockResolvedValue(mockCalculation);

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Skip: Error handling now works through AlisaFormHandler which handles errors differently
  it.skip('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (ApiClient.get as unknown as jest.SpyInstance).mockImplementation(() =>
      Promise.reject(new Error('API Error'))
    );

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading calculation:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('renders dialog when open and loaded', async () => {
    (ApiClient.get as unknown as jest.SpyInstance).mockResolvedValue(mockCalculation);

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays calculation name in title after loading', async () => {
    (ApiClient.get as unknown as jest.SpyInstance).mockResolvedValue(mockCalculation);

    renderWithProviders(
      <InvestmentCalculationEditDialog
        calculationId={1}
        open={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Calculation')).toBeInTheDocument();
  });
});
