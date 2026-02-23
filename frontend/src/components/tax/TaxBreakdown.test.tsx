import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils/test-wrapper';
import TaxBreakdown from './TaxBreakdown';

describe('TaxBreakdown', () => {
  const defaultProps = {
    grossIncome: 12000,
    deductions: 3000,
    depreciation: 500,
    netIncome: 8500,
    breakdown: [],
    depreciationBreakdown: [],
  };

  describe('deduction categories', () => {
    it('translates deduction category keys to display names', () => {
      const breakdown = [
        { category: 'housing-charge', amount: 1500, isTaxDeductible: true },
        { category: 'repairs', amount: 800, isTaxDeductible: true },
        { category: 'insurance', amount: 700, isTaxDeductible: true },
      ];

      renderWithProviders(
        <TaxBreakdown {...defaultProps} breakdown={breakdown} />
      );

      // Should display translated names, not raw keys
      expect(screen.getByText('Housing company charge')).toBeInTheDocument();
      expect(screen.getByText('Repairs')).toBeInTheDocument();
      expect(screen.getByText('Insurance')).toBeInTheDocument();

      // Raw keys should NOT be displayed
      expect(screen.queryByText('housing-charge')).not.toBeInTheDocument();
      expect(screen.queryByText('repairs')).not.toBeInTheDocument();
      expect(screen.queryByText('insurance')).not.toBeInTheDocument();
    });

    it('translates loan-interest category', () => {
      const breakdown = [
        { category: 'loan-interest', amount: 500, isTaxDeductible: true },
      ];

      renderWithProviders(
        <TaxBreakdown {...defaultProps} breakdown={breakdown} />
      );

      expect(screen.getByText('Loan interest')).toBeInTheDocument();
      expect(screen.queryByText('loan-interest')).not.toBeInTheDocument();
    });

    it('translates water and electricity categories', () => {
      const breakdown = [
        { category: 'water', amount: 200, isTaxDeductible: true },
        { category: 'electricity', amount: 300, isTaxDeductible: true },
      ];

      renderWithProviders(
        <TaxBreakdown {...defaultProps} breakdown={breakdown} />
      );

      expect(screen.getByText('Water fee')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
    });
  });
});
