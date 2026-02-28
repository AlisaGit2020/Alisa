import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types/entities';
import { PropertyStatus } from '@asset-types/common';

// Mock translations
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'investment-calculator:unlinkedProperty': 'No property linked',
        'investment-calculator:rentalYield': 'Rental yield',
      };
      return translations[key] || key;
    },
  }),
}));

// Import after mocking
import CalculationListItem from './CalculationListItem';

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

// Helper to create mock property
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 1,
  name: 'Helsinki Apartment',
  size: 55,
  status: PropertyStatus.PROSPECT,
  photo: '/uploads/properties/test-photo.jpg',
  address: {
    id: 1,
    street: 'Mannerheimintie 1',
    city: 'Helsinki',
    postalCode: '00100',
  },
  ...overrides,
});

describe('CalculationListItem', () => {
  const defaultProps = {
    calculation: createMockCalculation(),
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders calculation name', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      expect(screen.getByText('Test Calculation')).toBeInTheDocument();
    });

    it('renders calculation name when name is provided', () => {
      const calculation = createMockCalculation({ name: 'Investment Option A' });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      expect(screen.getByText('Investment Option A')).toBeInTheDocument();
    });

    it('shows property name when property is linked', () => {
      const property = createMockProperty({ name: 'Downtown Condo' });
      const calculation = createMockCalculation();

      renderWithProviders(
        <CalculationListItem
          {...defaultProps}
          calculation={calculation}
          property={property}
        />
      );

      expect(screen.getByText('Downtown Condo')).toBeInTheDocument();
    });

    it('shows placeholder text when no property is linked', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      expect(screen.getByText('No property linked')).toBeInTheDocument();
    });

    it('shows property image as avatar when property has photo', () => {
      const property = createMockProperty({ photo: '/uploads/properties/apartment.jpg' });
      const calculation = createMockCalculation();

      renderWithProviders(
        <CalculationListItem
          {...defaultProps}
          calculation={calculation}
          property={property}
        />
      );

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', expect.stringContaining('apartment.jpg'));
    });

    it('shows placeholder avatar when property has no image', () => {
      const property = createMockProperty({ photo: undefined });
      const calculation = createMockCalculation();

      renderWithProviders(
        <CalculationListItem
          {...defaultProps}
          calculation={calculation}
          property={property}
        />
      );

      // When no image, MUI Avatar shows fallback (letter or icon)
      // Check that there's no img element with src
      const avatar = screen.queryByRole('img');
      expect(avatar).not.toBeInTheDocument();
    });

    it('shows placeholder avatar when no property is linked', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      // When no property, should show a default avatar (icon or letter)
      const avatar = screen.queryByRole('img');
      expect(avatar).not.toBeInTheDocument();
    });

    it('shows rental yield as key metric', () => {
      const calculation = createMockCalculation({ rentalYieldPercent: 7.5 });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      // Should display the rental yield percentage
      expect(screen.getByText(/7[.,]5/)).toBeInTheDocument();
    });

    it('renders with data-testid for drag and drop', () => {
      const calculation = createMockCalculation({ id: 42 });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      expect(screen.getByTestId('calculation-list-item-42')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected styling when isSelected is true', () => {
      renderWithProviders(
        <CalculationListItem {...defaultProps} isSelected={true} />
      );

      const listItem = screen.getByTestId('calculation-list-item-1');
      // Selected items typically have a different background color or border
      expect(listItem).toHaveClass('Mui-selected');
    });

    it('does not apply selected styling when isSelected is false', () => {
      renderWithProviders(
        <CalculationListItem {...defaultProps} isSelected={false} />
      );

      const listItem = screen.getByTestId('calculation-list-item-1');
      expect(listItem).not.toHaveClass('Mui-selected');
    });

    it('does not apply selected styling when isSelected is undefined', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      const listItem = screen.getByTestId('calculation-list-item-1');
      expect(listItem).not.toHaveClass('Mui-selected');
    });
  });

  describe('Dragging State', () => {
    it('applies dragging styling when isDragging is true', () => {
      renderWithProviders(
        <CalculationListItem {...defaultProps} isDragging={true} />
      );

      const listItem = screen.getByTestId('calculation-list-item-1');
      // Dragging items typically have reduced opacity or different styling
      expect(listItem).toHaveStyle({ opacity: '0.5' });
    });

    it('does not apply dragging styling when isDragging is false', () => {
      renderWithProviders(
        <CalculationListItem {...defaultProps} isDragging={false} />
      );

      const listItem = screen.getByTestId('calculation-list-item-1');
      expect(listItem).not.toHaveStyle({ opacity: '0.5' });
    });

    it('does not apply dragging styling when isDragging is undefined', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      const listItem = screen.getByTestId('calculation-list-item-1');
      expect(listItem).not.toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const calculation = createMockCalculation({ id: 5 });

      renderWithProviders(
        <CalculationListItem
          {...defaultProps}
          calculation={calculation}
          onClick={onClick}
        />
      );

      const listItem = screen.getByTestId('calculation-list-item-5');
      await user.click(listItem);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(calculation);
    });

    it('does not throw when onClick is not provided', async () => {
      const user = userEvent.setup();
      const calculation = createMockCalculation();

      renderWithProviders(
        <CalculationListItem calculation={calculation} />
      );

      const listItem = screen.getByTestId('calculation-list-item-1');

      // Should not throw
      await expect(user.click(listItem)).resolves.not.toThrow();
    });

    it('has appropriate cursor style indicating clickability', () => {
      renderWithProviders(<CalculationListItem {...defaultProps} />);

      const listItem = screen.getByTestId('calculation-list-item-1');
      expect(listItem).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Edge Cases', () => {
    it('handles calculation without name gracefully', () => {
      const calculation = createMockCalculation({ name: undefined });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      // Should render without crashing, possibly showing a default or empty name
      expect(screen.getByTestId('calculation-list-item-1')).toBeInTheDocument();
    });

    it('handles calculation with empty name', () => {
      const calculation = createMockCalculation({ name: '' });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      expect(screen.getByTestId('calculation-list-item-1')).toBeInTheDocument();
    });

    it('handles zero rental yield', () => {
      const calculation = createMockCalculation({ rentalYieldPercent: 0 });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('handles negative rental yield', () => {
      const calculation = createMockCalculation({ rentalYieldPercent: -2.5 });

      renderWithProviders(
        <CalculationListItem {...defaultProps} calculation={calculation} />
      );

      expect(screen.getByText(/-2[.,]5/)).toBeInTheDocument();
    });
  });
});