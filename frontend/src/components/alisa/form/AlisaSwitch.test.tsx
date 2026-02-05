import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaSwitch from './AlisaSwitch';

describe('AlisaSwitch', () => {
  it('renders with label', () => {
    renderWithProviders(
      <AlisaSwitch label="Test Switch" value={false} onChange={jest.fn()} />
    );

    expect(screen.getByText('Test Switch')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    renderWithProviders(
      <AlisaSwitch label="Test Switch" value={true} onChange={jest.fn()} />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('renders unchecked state', () => {
    renderWithProviders(
      <AlisaSwitch label="Test Switch" value={false} onChange={jest.fn()} />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AlisaSwitch label="Test Switch" value={false} onChange={mockOnChange} />
    );

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AlisaSwitch label="Test Switch" value={false} disabled onChange={jest.fn()} />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });
});
