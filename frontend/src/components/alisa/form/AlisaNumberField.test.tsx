import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaNumberField from './AlisaNumberField';

describe('AlisaNumberField', () => {
  it('renders with label and value', () => {
    renderWithProviders(
      <AlisaNumberField label="Amount" value={100} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toBeInTheDocument();
    expect(numberField).toHaveValue(100);
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AlisaNumberField label="Amount" value={0} onChange={mockOnChange} />
    );

    const numberField = screen.getByLabelText('Amount');
    await user.clear(numberField);
    await user.type(numberField, '50');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders with adornment', () => {
    renderWithProviders(
      <AlisaNumberField
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
      <AlisaNumberField
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
      <AlisaNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveAttribute('type', 'number');
  });

  it('handles zero value', () => {
    renderWithProviders(
      <AlisaNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveValue(0);
  });

  it('handles negative value', () => {
    renderWithProviders(
      <AlisaNumberField label="Amount" value={-50} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveValue(-50);
  });

  it('renders fullWidth by default', () => {
    const { container } = renderWithProviders(
      <AlisaNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });

  it('respects fullWidth=false', () => {
    const { container } = renderWithProviders(
      <AlisaNumberField label="Amount" value={0} fullWidth={false} onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).not.toHaveClass('MuiFormControl-fullWidth');
  });

  it('calls onBlur when field loses focus', async () => {
    const user = userEvent.setup();
    const mockOnBlur = jest.fn();

    renderWithProviders(
      <AlisaNumberField
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
      <AlisaNumberField label="Amount" value={0} onChange={jest.fn()} />
    );

    const numberField = screen.getByLabelText('Amount');
    expect(numberField).toHaveAttribute('autocomplete', 'off');
  });
});
