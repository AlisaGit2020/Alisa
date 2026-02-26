import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetEditableNumber from './AssetEditableNumber';

describe('AssetEditableNumber', () => {
  describe('display mode', () => {
    it('renders value as text when not editing', () => {
      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={1500}
          onChange={jest.fn()}
        />
      );

      // Should show the value as text, not in an input
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('renders label above the value', () => {
      renderWithProviders(
        <AssetEditableNumber
          label="Maintenance fee"
          value={250}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Maintenance fee')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('renders suffix when provided', () => {
      renderWithProviders(
        <AssetEditableNumber
          label="Price"
          value={100}
          suffix="€/month"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText(/100.*€\/month/)).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('shows input when clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={1500}
          onChange={jest.fn()}
        />
      );

      const displayText = screen.getByText('1500');
      await user.click(displayText);

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
      });
    });

    it('shows current value in input when editing', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={1500}
          onChange={jest.fn()}
        />
      );

      const displayText = screen.getByText('1500');
      await user.click(displayText);

      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(1500);
      });
    });

    it('calls onChange when value is modified', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();

      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={100}
          onChange={mockOnChange}
        />
      );

      const displayText = screen.getByText('100');
      await user.click(displayText);

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '200');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('returns to display mode when input loses focus', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={1500}
          onChange={jest.fn()}
        />
      );

      const displayText = screen.getByText('1500');
      await user.click(displayText);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();

      // Blur the input
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
      });
    });
  });

  describe('readonly mode', () => {
    it('does not enter edit mode when readOnly is true', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AssetEditableNumber
          label="Amount"
          value={1500}
          readOnly
          onChange={jest.fn()}
        />
      );

      const displayText = screen.getByText('1500');
      await user.click(displayText);

      // Should still show text, not input
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.getByText('1500')).toBeInTheDocument();
    });
  });
});
