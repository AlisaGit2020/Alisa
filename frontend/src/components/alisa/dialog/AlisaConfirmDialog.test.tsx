import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaConfirmDialog from './AlisaConfirmDialog';

describe('AlisaConfirmDialog', () => {
  it('renders title and message', () => {
    renderWithProviders(
      <AlisaConfirmDialog
        open={true}
        title="Test Title"
        contentText="Test Message"
        buttonTextCancel="Cancel"
        buttonTextConfirm="Confirm"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    renderWithProviders(
      <AlisaConfirmDialog
        open={true}
        title="Test Title"
        contentText="Test Message"
        buttonTextCancel="Cancel"
        buttonTextConfirm="Confirm"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = jest.fn();

    renderWithProviders(
      <AlisaConfirmDialog
        open={true}
        title="Test Title"
        contentText="Test Message"
        buttonTextCancel="Cancel"
        buttonTextConfirm="Confirm"
        onClose={jest.fn()}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AlisaConfirmDialog
        open={true}
        title="Test Title"
        contentText="Test Message"
        buttonTextCancel="Cancel"
        buttonTextConfirm="Confirm"
        onClose={mockOnClose}
        onConfirm={jest.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    renderWithProviders(
      <AlisaConfirmDialog
        open={false}
        title="Test Title"
        contentText="Test Message"
        buttonTextCancel="Cancel"
        buttonTextConfirm="Confirm"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('renders with custom button labels', () => {
    renderWithProviders(
      <AlisaConfirmDialog
        open={true}
        title="Delete Item"
        contentText="Are you sure?"
        buttonTextCancel="No"
        buttonTextConfirm="Yes"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
  });
});
