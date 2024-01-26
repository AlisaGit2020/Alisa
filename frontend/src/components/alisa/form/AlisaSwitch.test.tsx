import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaSwitch from './AlisaSwitch';

describe('AlisaSwitch', () => {
  it('renders with provided props', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      value: true,
      disabled: false,
      onChange: mockOnChange,
    };

    render(<AlisaSwitch {...props} />);

    const switchElement = screen.getByLabelText('Test Label');

    // Check if the Switch renders with the provided props
    expect(switchElement).toBeChecked();
    expect(switchElement).not.toBeDisabled();
  });

  it('triggers onChange callback when switched', () => {
    const mockOnChange = jest.fn();

    const props = {
      label: 'Test Label',
      onChange: mockOnChange,
    };

    render(<AlisaSwitch {...props} />);

    const switchElement = screen.getByLabelText('Test Label');

    // Trigger a change event by clicking the switch
    fireEvent.click(switchElement);

    // Check if the onChange callback is called
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // You may want to add more specific assertions based on your use case
  });
});
