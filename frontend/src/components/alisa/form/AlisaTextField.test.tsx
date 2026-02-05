import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaTextField from './AlisaTextField';

describe('AlisaTextField', () => {
  it('renders with label and value', () => {
    renderWithProviders(
      <AlisaTextField label="Test Label" value="Test Value" onChange={jest.fn()} />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toBeInTheDocument();
    expect(textField).toHaveValue('Test Value');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AlisaTextField label="Test Label" value="" onChange={mockOnChange} />
    );

    const textField = screen.getByLabelText('Test Label');
    await user.type(textField, 'New Value');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders with adornment', () => {
    renderWithProviders(
      <AlisaTextField
        label="Test Label"
        value=""
        adornment="€"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AlisaTextField
        label="Test Label"
        value="Test Value"
        disabled
        onChange={jest.fn()}
      />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toBeDisabled();
  });

  it('applies autoComplete attribute', () => {
    renderWithProviders(
      <AlisaTextField
        label="Test Label"
        value=""
        autoComplete="off"
        onChange={jest.fn()}
      />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toHaveAttribute('autocomplete', 'off');
  });

  it('handles empty value', () => {
    renderWithProviders(
      <AlisaTextField label="Test Label" value="" onChange={jest.fn()} />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toHaveValue('');
  });

  it('renders fullWidth when specified', () => {
    const { container } = renderWithProviders(
      <AlisaTextField label="Test Label" value="" fullWidth onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });
});
