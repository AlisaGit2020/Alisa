import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import InvestmentCalculatorForm from './InvestmentCalculatorForm';

describe('InvestmentCalculatorForm', () => {
  it('renders form with required fields', () => {
    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={jest.fn()} />
    );

    // Check for key inputs - use getAllByRole for inputs that may have multiple matches
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);

    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders with default numeric values', () => {
    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={jest.fn()} />
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
        onCalculate={jest.fn()}
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

  it('calls onCalculate with form data when submitted', async () => {
    const user = userEvent.setup();
    const mockOnCalculate = jest.fn();

    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={mockOnCalculate} />
    );

    // Find and fill name field (second textbox, after the etuovi URL input)
    const textboxes = screen.getAllByRole('textbox');
    const nameInput = textboxes[1]; // Second textbox is the name (first is etuovi URL)
    await user.clear(nameInput);
    await user.type(nameInput, 'My Investment');

    // Submit form - find button with type="submit"
    const buttons = screen.getAllByRole('button');
    const calculateButton = buttons.find(btn => btn.getAttribute('type') === 'submit');
    await user.click(calculateButton!);

    expect(mockOnCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        deptFreePrice: 100000,
        deptShare: 0,
        maintenanceFee: 200,
        rentPerMonth: 800,
        name: 'My Investment',
      })
    );
  });

  it('updates form data when inputs change', async () => {
    const user = userEvent.setup();
    const mockOnCalculate = jest.fn();

    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={mockOnCalculate} />
    );

    const spinbuttons = screen.getAllByRole('spinbutton');

    // Find and change debt-free price (first spinbutton with value 100000)
    const deptFreePriceInput = spinbuttons.find(input => (input as HTMLInputElement).value === '100000');
    if (deptFreePriceInput) {
      await user.clear(deptFreePriceInput);
      await user.type(deptFreePriceInput, '200000');
    }

    // Find and change rent (spinbutton with value 800)
    const rentInput = spinbuttons.find(input => (input as HTMLInputElement).value === '800');
    if (rentInput) {
      await user.clear(rentInput);
      await user.type(rentInput, '1200');
    }

    // Add name (second textbox, after etuovi URL)
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[1], 'Test');

    // Submit form - find button with type="submit"
    const buttons = screen.getAllByRole('button');
    const calculateButton = buttons.find(btn => btn.getAttribute('type') === 'submit');
    await user.click(calculateButton!);

    expect(mockOnCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        deptFreePrice: 200000,
        rentPerMonth: 1200,
      })
    );
  });

  it('resets form when initialValues change', async () => {
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
        onCalculate={jest.fn()}
        initialValues={initialValues1}
      />
    );

    // Name input is at index 1 (after etuovi URL input)
    let textboxes = screen.getAllByRole('textbox');
    expect((textboxes[1] as HTMLInputElement).value).toBe('First');

    // Rerender with new initial values
    rerender(
      <InvestmentCalculatorForm
        onCalculate={jest.fn()}
        initialValues={initialValues2}
      />
    );

    // Form should update with new values
    await waitFor(() => {
      textboxes = screen.getAllByRole('textbox');
      expect((textboxes[1] as HTMLInputElement).value).toBe('Second');
    });

    const spinbuttons = screen.getAllByRole('spinbutton');
    const values = spinbuttons.map(input => (input as HTMLInputElement).value);
    expect(values).toContain('200000');
    expect(values).toContain('1200');
  });

  it('renders submit button', () => {
    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={jest.fn()} />
    );

    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.getAttribute('type') === 'submit');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('renders multiple input fields for investment calculation', () => {
    renderWithProviders(
      <InvestmentCalculatorForm onCalculate={jest.fn()} />
    );

    // Count number of spinbuttons (number inputs)
    const spinbuttons = screen.getAllByRole('spinbutton');
    // Should have at least 6 number fields
    expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
  });
});
