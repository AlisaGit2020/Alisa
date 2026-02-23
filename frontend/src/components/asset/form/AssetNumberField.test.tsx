import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetNumberField from './AssetNumberField';

describe('AssetNumberField', () => {
  it('renders with label and value', () => {
    renderWithProviders(
      <AssetNumberField label="Amount" value={100} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toBeInTheDocument();
    expect(numberField).toHaveValue(100);
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={mockOnChange} />
    );

    const numberField = screen.getByLabelText('Amount');
    await user.clear(numberField);
    await user.type(numberField, '50');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders with adornment', () => {
    renderWithProviders(
      <AssetNumberField
        label="Price"
        value={100}
        adornment="€"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AssetNumberField
        label="Amount"
        value={100}
        disabled
        onChange={jest.fn()}
      />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toBeDisabled();
  });

  it('has type number', () => {
    renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveAttribute('type', 'number');
  });

  it('handles zero value', () => {
    renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveValue(0);
  });

  it('handles negative value', () => {
    renderWithProviders(
      <AssetNumberField label="Amount" value={-50} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveValue(-50);
  });

  it('renders fullWidth by default', () => {
    const { container } = renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });

  it('respects fullWidth=false', () => {
    const { container } = renderWithProviders(
      <AssetNumberField label="Amount" value={0} fullWidth={false} onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).not.toHaveClass('MuiFormControl-fullWidth');
  });

  it('calls onBlur when field loses focus', async () => {
    const user = userEvent.setup();
    const mockOnBlur = jest.fn();

    renderWithProviders(
      <AssetNumberField
        label="Amount"
        value={100}
        onChange={jest.fn()}
        onBlur={mockOnBlur}
      />
    );

    const numberField = screen.getByLabelText('Amount');
    await user.click(numberField);
    await user.tab();

    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('has autoComplete off by default', () => {
    renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveAttribute('autocomplete', 'off');
  });

  it('shrinks label when value is zero', () => {
    const { container } = renderWithProviders(
      <AssetNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const label = container.querySelector('.MuiInputLabel-root');
    expect(label).toHaveAttribute('data-shrink', 'true');
  });

  it('renders placeholder when provided', () => {
    renderWithProviders(
      <AssetNumberField
        label="Amount"
        value={''}
        placeholder="0.00"
        onChange={jest.fn()}
      />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveAttribute('placeholder', '0.00');
  });
});
