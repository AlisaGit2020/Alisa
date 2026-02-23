import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetTextField from './AssetTextField';

describe('AssetTextField', () => {
  it('renders with label and value', () => {
    renderWithProviders(
      <AssetTextField label="Test Label" value="Test Value" onChange={jest.fn()} />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toBeInTheDocument();
    expect(textField).toHaveValue('Test Value');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetTextField label="Test Label" value="" onChange={mockOnChange} />
    );

    const textField = screen.getByLabelText('Test Label');
    await user.type(textField, 'New Value');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders with adornment', () => {
    renderWithProviders(
      <AssetTextField
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
      <AssetTextField
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
      <AssetTextField
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
      <AssetTextField label="Test Label" value="" onChange={jest.fn()} />
    );

    const textField = screen.getByLabelText('Test Label');
    expect(textField).toHaveValue('');
  });

  it('renders fullWidth when specified', () => {
    const { container } = renderWithProviders(
      <AssetTextField label="Test Label" value="" fullWidth onChange={jest.fn()} />
    );

    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });

  describe('clearable', () => {
    it('shows clear button by default when has value', () => {
      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value="Some text"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'clear' })).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value=""
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
    });

    it('does not show clear button when clearable is false', () => {
      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value="Some text"
          clearable={false}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
    });

    it('does not show clear button when disabled', () => {
      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value="Some text"
          disabled
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClear = jest.fn();

      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value="Some text"
          onClear={mockOnClear}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: 'clear' }));

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('calls onChange with empty value when clear is clicked and no onClear provided', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      renderWithProviders(
        <AssetTextField
          label="Test Label"
          value="Some text"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole('button', { name: 'clear' }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ target: { value: '' } })
      );
    });
  });
});
