import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import InvestmentCalculatorForm from './InvestmentCalculatorForm';

describe('InvestmentCalculatorForm', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with required fields', () => {
    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    // Check for key inputs - use getAllByRole for inputs that may have multiple matches
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);

    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders with default numeric values', () => {
    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    // Find inputs by their values
    const spinbuttons = screen.getAllByRole('spinbutton');

    // Check that we have expected default values in the form
    const values = spinbuttons.map(input => (input as HTMLInputElement).value);
    expect(values).toContain('100000'); // deptFreePrice
    expect(values).toContain('200'); // maintenanceFee
    expect(values).toContain('800'); // rentPerMonth
  });

  it('renders with initial values when provided', () => {
    const initialValues = {
      deptFreePrice: 150000,
      deptShare: 50000,
      transferTaxPercent: 2.5,
      maintenanceFee: 250,
      chargeForFinancialCosts: 75,
      rentPerMonth: 1000,
      name: 'Test Calculation',
    };

    renderWithProviders(
      <InvestmentCalculatorForm
        {...defaultProps}
        initialValues={initialValues}
      />
    );

    // Name input is at index 1 (after etuovi URL input)
    const textboxes = screen.getAllByRole('textbox');
    const nameInput = textboxes.find(input => (input as HTMLInputElement).value === 'Test Calculation');
    expect(nameInput).toBeTruthy();

    const spinbuttons = screen.getAllByRole('spinbutton');
    const values = spinbuttons.map(input => (input as HTMLInputElement).value);
    expect(values).toContain('150000');
    expect(values).toContain('1000');
  });

  it('renders save and cancel buttons', () => {
    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    const buttons = screen.getAllByRole('button');
    // Should have Save, Cancel, and Fetch from Etuovi buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('updates form data when inputs change', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    const spinbuttons = screen.getAllByRole('spinbutton');

    // Find and change debt-free price (first spinbutton with value 100000)
    const deptFreePriceInput = spinbuttons.find(input => (input as HTMLInputElement).value === '100000');
    if (deptFreePriceInput) {
      await user.clear(deptFreePriceInput);
      await user.type(deptFreePriceInput, '200000');
    }

    // Verify the value changed
    expect((deptFreePriceInput as HTMLInputElement).value).toBe('200000');
  });

  it('resets form when remounted with new key', () => {
    // Form now uses internal state and requires key change to reset
    // This matches how parent components use it (e.g., InvestmentCalculatorProtected)
    const initialValues1 = {
      deptFreePrice: 100000,
      rentPerMonth: 800,
      name: 'First',
    };

    const initialValues2 = {
      deptFreePrice: 200000,
      rentPerMonth: 1200,
      name: 'Second',
    };

    const { rerender } = renderWithProviders(
      <InvestmentCalculatorForm
        key={1}
        {...defaultProps}
        initialValues={initialValues1}
      />
    );

    // Name input is at index 1 (after etuovi URL input)
    let textboxes = screen.getAllByRole('textbox');
    expect((textboxes[1] as HTMLInputElement).value).toBe('First');

    // Rerender with new key to force remount
    rerender(
      <InvestmentCalculatorForm
        key={2}
        {...defaultProps}
        initialValues={initialValues2}
      />
    );

    // Form should update with new values after remount
    textboxes = screen.getAllByRole('textbox');
    expect((textboxes[1] as HTMLInputElement).value).toBe('Second');

    const spinbuttons = screen.getAllByRole('spinbutton');
    const values = spinbuttons.map(input => (input as HTMLInputElement).value);
    expect(values).toContain('200000');
    expect(values).toContain('1200');
  });

  it('renders multiple input fields for investment calculation', () => {
    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    // Count number of spinbuttons (number inputs)
    const spinbuttons = screen.getAllByRole('spinbutton');
    // Should have at least 6 number fields
    expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders etuovi fetch section', () => {
    renderWithProviders(
      <InvestmentCalculatorForm {...defaultProps} />
    );

    // Should have the etuovi URL input
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThanOrEqual(2); // URL + name at minimum
  });
});
