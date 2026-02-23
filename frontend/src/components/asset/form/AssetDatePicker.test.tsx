import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetDatePicker from './AssetDatePicker';

describe('AssetDatePicker', () => {
  it('renders with label', () => {
    renderWithProviders(
      <AssetDatePicker
        label="Test Label"
        value={new Date('2024-01-01')}
        onChange={jest.fn()}
      />
    );

    // The label appears multiple times (label element and legend)
    const labels = screen.getAllByText('Test Label');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('displays the date value', () => {
    renderWithProviders(
      <AssetDatePicker
        label="Test Label"
        value={new Date('2024-01-15')}
        onChange={jest.fn()}
      />
    );

    const input = screen.getByDisplayValue('01/15/2024');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when date is changed', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetDatePicker
        label="Test Label"
        value={new Date('2024-01-01')}
        onChange={mockOnChange}
      />
    );

    const monthInput = screen.getByRole('spinbutton', { name: 'Month' });
    await user.clear(monthInput);
    await user.type(monthInput, '02');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AssetDatePicker
        label="Test Label"
        value={new Date('2024-01-01')}
        disabled
        onChange={jest.fn()}
      />
    );

    const monthInput = screen.getByRole('spinbutton', { name: 'Month' });
    expect(monthInput).toHaveAttribute('aria-disabled', 'true');
  });

  it('handles null value', () => {
    renderWithProviders(
      <AssetDatePicker
        label="Test Label"
        value={null}
        onChange={jest.fn()}
      />
    );

    // When null, the component should still render
    const labels = screen.getAllByText('Test Label');
    expect(labels.length).toBeGreaterThan(0);
  });
});
