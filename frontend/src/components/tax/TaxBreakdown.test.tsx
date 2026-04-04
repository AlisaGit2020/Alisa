import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/utils/test-wrapper';
import TaxBreakdown from './TaxBreakdown';

describe('TaxBreakdown', () => {
  const defaultProps = {
    grossIncome: 12000,
    totalGrossIncome: 12000,
    deductions: 3000,
    totalDeductions: 3000,
    depreciation: 500,
    totalDepreciation: 500,
    netIncome: 8500,
    totalNetIncome: 8500,
    breakdown: [] as {
      category: string;
      amount: number;
      totalAmount: number;
      isTaxDeductible: boolean;
      isCapitalImprovement?: boolean;
    }[],
    incomeBreakdown: [],
    depreciationBreakdown: [],
  };

  it('renders 7H form structure with all category rows', () => {
    renderWithProviders(<TaxBreakdown {...defaultProps} />);

    expect(screen.getByText('Form 7H: Rental Income - Apartments')).toBeInTheDocument();
    expect(screen.getByText('Total rental income for the year')).toBeInTheDocument();
    expect(screen.getByText('Housing charges and water fees')).toBeInTheDocument();
    expect(screen.getByText('Financial charges capitalized by company')).toBeInTheDocument();
    expect(screen.getByText('Annual repair costs')).toBeInTheDocument();
    expect(screen.getByText('Other costs')).toBeInTheDocument();
    expect(screen.getByText('Taxable income')).toBeInTheDocument();
  });

  it('shows expense type subtotals when expanding a row', async () => {
    const user = userEvent.setup();
    const breakdown = [
      { category: 'housing-charge', amount: 1500, totalAmount: 1500, isTaxDeductible: true },
      { category: 'water', amount: 200, totalAmount: 200, isTaxDeductible: true },
    ];

    renderWithProviders(
      <TaxBreakdown {...defaultProps} breakdown={breakdown} />
    );

    // Sub-rows should not be visible initially
    expect(screen.queryByText('Housing company charge')).not.toBeInTheDocument();
    expect(screen.queryByText('Water fee')).not.toBeInTheDocument();

    // Click to expand "Housing charges and water fees"
    await user.click(screen.getByText('Housing charges and water fees'));

    // Now sub-rows should be visible
    expect(screen.getByText('Housing company charge')).toBeInTheDocument();
    expect(screen.getByText('Water fee')).toBeInTheDocument();
  });

  it('groups expense types into correct 7H categories', async () => {
    const user = userEvent.setup();
    const breakdown = [
      { category: 'housing-charge', amount: 1500, totalAmount: 1500, isTaxDeductible: true },
      { category: 'insurance', amount: 700, totalAmount: 700, isTaxDeductible: true },
      { category: 'repairs', amount: 800, totalAmount: 800, isTaxDeductible: true },
      { category: 'financial-charge', amount: 300, totalAmount: 300, isTaxDeductible: true },
    ];

    renderWithProviders(
      <TaxBreakdown {...defaultProps} breakdown={breakdown} />
    );

    // Expand "Other costs" - should contain insurance
    await user.click(screen.getByText('Other costs'));
    expect(screen.getByText('Insurance')).toBeInTheDocument();

    // Expand "Annual repair costs"
    await user.click(screen.getByText('Annual repair costs'));
    expect(screen.getByText('Repairs')).toBeInTheDocument();
  });

  it('shows income breakdown when expanding income row', async () => {
    const user = userEvent.setup();
    const incomeBreakdown = [
      { category: 'rental', amount: 10000, totalAmount: 10000 },
      { category: 'airbnb', amount: 2000, totalAmount: 2000 },
    ];

    renderWithProviders(
      <TaxBreakdown {...defaultProps} incomeBreakdown={incomeBreakdown} />
    );

    await user.click(screen.getByText('Total rental income for the year'));
    expect(screen.getByText('Rental income')).toBeInTheDocument();
    expect(screen.getByText('Airbnb')).toBeInTheDocument();
  });

  describe('dual column display', () => {
    it('shows dual columns when ownership < 100%', () => {
      renderWithProviders(
        <TaxBreakdown {...defaultProps} ownershipShare={50} totalGrossIncome={24000} />
      );

      expect(screen.getByText('Total (100%)')).toBeInTheDocument();
      expect(screen.getByText('Your share (50%)')).toBeInTheDocument();
    });

    it('does not show dual columns when ownership is 100%', () => {
      renderWithProviders(
        <TaxBreakdown {...defaultProps} ownershipShare={100} />
      );

      expect(screen.queryByText('Total (100%)')).not.toBeInTheDocument();
    });

    it('does not show dual columns when ownership is undefined', () => {
      renderWithProviders(
        <TaxBreakdown {...defaultProps} />
      );

      expect(screen.queryByText('Total (100%)')).not.toBeInTheDocument();
    });
  });
});
