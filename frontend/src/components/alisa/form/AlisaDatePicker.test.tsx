import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaDatePicker from './AlisaDatepicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'


describe('AlisaDatePicker', () => {
  it('renders with provided props', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      value: '2022-01-26', // Provide a date string in the format YYYY-MM-DD
      autoFocus: true,
      disabled: false,
      fullWidth: false,
      onChange: mockOnChange,
    };

    render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AlisaDatePicker {...props} />
        </LocalizationProvider>
      );

    const datePicker = screen.getByLabelText('Test Label');

    // Check if the DatePicker renders with the provided props    
    expect(datePicker).toHaveAttribute('aria-invalid', 'false'); // Assuming the provided date is valid
    expect(datePicker).toBeEnabled();

    // Check if the date is displayed in the input
    expect(datePicker).toHaveValue('01/26/2022');

    // Check if the DatePicker has the correct width
    expect(datePicker).toHaveStyle('width: 100%;'); // Adjust this based on your styling

    // You may want to add more specific assertions based on your use case
  });

  it('triggers onChange callback when date is changed', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      value: '2022-01-26',
      onChange: mockOnChange,
    };

    render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AlisaDatePicker {...props} />
        </LocalizationProvider>
      );

    const datePicker = screen.getByLabelText('Test Label');

    // Trigger a change event by manually entering a new date
    fireEvent.change(datePicker, { target: { value: '2022-02-01' } });

    // Check if the onChange callback is called
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // You may want to add more specific assertions based on your use case
  });
});
