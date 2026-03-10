import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetMoneyField, { parseMoneyValue } from './AssetMoneyField';

describe('AssetMoneyField', () => {
  it('renders with label and value', () => {
    renderWithProviders(
      <AssetMoneyField label="Amount" value={100.50} onChange={jest.fn()} />
    );

    const moneyField = screen.getByLabelText('Amount');
    expect(moneyField).toBeInTheDocument();
    expect(moneyField).toHaveValue('100.5');
  });

  it('shows euro adornment by default', () => {
    renderWithProviders(
      <AssetMoneyField label="Price" value={100} onChange={jest.fn()} />
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('allows custom adornment', () => {
    renderWithProviders(
      <AssetMoneyField label="Price" value={100} adornment="$" onChange={jest.fn()} />
    );

    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetMoneyField label="Amount" value={0} onChange={mockOnChange} />
    );

    const moneyField = screen.getByLabelText('Amount');
    await user.clear(moneyField);
    await user.type(moneyField, '181.45');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('returns undefined for empty input', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetMoneyField label="Amount" value={100} onChange={mockOnChange} />
    );

    const moneyField = screen.getByLabelText('Amount');
    await user.clear(moneyField);

    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    expect(lastCall[0]).toBeUndefined();
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AssetMoneyField label="Amount" value={100} disabled onChange={jest.fn()} />
    );

    const moneyField = screen.getByLabelText('Amount');
    expect(moneyField).toBeDisabled();
  });

  it('renders fullWidth by default', () => {
    const { container } = renderWithProviders(
      <AssetMoneyField label="Amount" value={0} onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });

  it('shrinks label when value is zero', () => {
    const { container } = renderWithProviders(
      <AssetMoneyField label="Amount" value={0} onChange={jest.fn()} />
    );

    const label = container.querySelector('.MuiInputLabel-root');
    expect(label).toHaveAttribute('data-shrink', 'true');
  });

  it('uses text type with decimal inputMode for comma support', () => {
    renderWithProviders(
      <AssetMoneyField label="Amount" value={0} onChange={jest.fn()} />
    );

    const moneyField = screen.getByLabelText('Amount');
    expect(moneyField).toHaveAttribute('type', 'text');
    expect(moneyField).toHaveAttribute('inputMode', 'decimal');
  });

  it('handles typing with comma separator', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetMoneyField label="Amount" value={0} onChange={mockOnChange} />
    );

    const moneyField = screen.getByLabelText('Amount');
    await user.clear(moneyField);
    await user.type(moneyField, '181,45');

    expect(mockOnChange).toHaveBeenLastCalledWith(181.45);
  });
});

describe('parseMoneyValue', () => {
  it('parses decimal values with period', () => {
    expect(parseMoneyValue('181.45')).toBe(181.45);
  });

  it('converts comma to period for European decimal input', () => {
    expect(parseMoneyValue('181,45')).toBe(181.45);
  });

  it('rounds to 2 decimal places', () => {
    expect(parseMoneyValue('99.999')).toBe(100);
    expect(parseMoneyValue('99.994')).toBe(99.99);
    expect(parseMoneyValue('123.456')).toBe(123.46);
  });

  it('returns undefined for empty input', () => {
    expect(parseMoneyValue('')).toBeUndefined();
    expect(parseMoneyValue('   ')).toBeUndefined();
  });

  it('preserves zero as valid value', () => {
    expect(parseMoneyValue('0')).toBe(0);
    expect(parseMoneyValue('0.00')).toBe(0);
  });

  it('handles negative values', () => {
    expect(parseMoneyValue('-50.25')).toBe(-50.25);
    expect(parseMoneyValue('-100')).toBe(-100);
  });

  it('returns undefined for invalid input', () => {
    expect(parseMoneyValue('abc')).toBeUndefined();
    expect(parseMoneyValue('12abc')).toBe(12);
  });

  it('handles large numbers', () => {
    expect(parseMoneyValue('150000.50')).toBe(150000.5);
    expect(parseMoneyValue('1000000')).toBe(1000000);
  });
});
