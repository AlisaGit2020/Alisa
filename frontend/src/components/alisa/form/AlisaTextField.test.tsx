import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaTextField from './AlisaTextField';

describe('AlisaTextField', () => {
  it('renders with provided props', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      value: 'Test Value',
      adornment: 'Adornment',
      autoComplete: 'off',
      autoFocus: true,
      disabled: true,
      fullWidth: false,
      onChange: mockOnChange,
    };

    render(<AlisaTextField {...props} />);

    const textField = screen.getByLabelText('Test Label');

    // Check if the TextField renders with the provided props
    expect(textField).toHaveValue('Test Value');
    expect(textField).toHaveAttribute('autocomplete', 'off');    
    expect(textField).toHaveAttribute('disabled', '');    

    // Check if the InputAdornment is rendered
    expect(screen.getByText('Adornment')).toBeInTheDocument();
  });

  it('triggers onChange callback when text is entered', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      onChange: mockOnChange,
    };

    render(<AlisaTextField {...props} />);

    const textField = screen.getByLabelText('Test Label');

    // Trigger a change event with the value directly
    fireEvent.change(textField, { target: { value: 'New Value' } });

    // Check if the onChange callback is called with the correct value
    expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: expect.objectContaining({ value: 'New Value' }) })
      );
  });
});
