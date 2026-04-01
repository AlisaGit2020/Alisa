import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyChargeDialog from './PropertyChargeDialog';

describe('PropertyChargeDialog', () => {
  const defaultProps = {
    open: true,
    propertyId: 1,
    onClose: jest.fn(),
    onChargesUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog when open', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check for dialog title
    expect(screen.getByText('Charges')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
