import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaConfirmDialog from './AlisaConfirmDialog';

describe('AlisaConfirmDialog', () => {
  it('renders with correct title and content', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    const props = {
      open: true,
      title: 'Test Title',
      contentText: 'Test Content',
      buttonTextCancel: 'Cancel',
      buttonTextConfirm: 'Confirm',
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    };

    render(<AlisaConfirmDialog {...props} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose and onConfirm when buttons are clicked', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    const props = {
      open: true,
      title: 'Test Title',
      contentText: 'Test Content',
      buttonTextCancel: 'Cancel',
      buttonTextConfirm: 'Confirm',
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    };

    render(<AlisaConfirmDialog {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
