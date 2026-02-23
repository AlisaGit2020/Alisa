import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import InvestmentCalculationViewDialog from './InvestmentCalculationViewDialog';
import ApiClient from '@asset-lib/api-client';

// Spy on ApiClient methods
jest.spyOn(ApiClient, 'get');

describe('InvestmentCalculationViewDialog', () => {
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
      <InvestmentCalculationViewDialog
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
      <InvestmentCalculationViewDialog
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
      <InvestmentCalculationViewDialog
        calculationId={1}
        open={false}
        onClose={jest.fn()}
      />
    );

    expect(ApiClient.get).not.toHaveBeenCalled();
  });

  it('does not load when calculationId is 0', () => {
    renderWithProviders(
      <InvestmentCalculationViewDialog
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
      <InvestmentCalculationViewDialog
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

  it('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (ApiClient.get as unknown as jest.SpyInstance).mockRejectedValue(new Error('API Error'));

    renderWithProviders(
      <InvestmentCalculationViewDialog
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
      <InvestmentCalculationViewDialog
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
      <InvestmentCalculationViewDialog
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

  it('does not show save button in view mode', async () => {
    (ApiClient.get as unknown as jest.SpyInstance).mockResolvedValue(mockCalculation);

    renderWithProviders(
      <InvestmentCalculationViewDialog
        calculationId={1}
        open={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });
});
