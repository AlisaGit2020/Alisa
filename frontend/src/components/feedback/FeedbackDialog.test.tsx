import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import FeedbackDialog from './FeedbackDialog';

describe('FeedbackDialog', () => {
  it('renders dialog when open', () => {
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<FeedbackDialog open={false} onClose={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders form fields', () => {
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    // Check for combobox (select) and textbox (textarea)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('submit button is disabled when message is empty', () => {
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    // Find the disabled button (submit button should be disabled)
    const disabledButton = screen.getByRole('button', { name: /submit/i });
    expect(disabledButton).toBeDisabled();
  });

  it('submit button is enabled when message is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    const messageField = screen.getByRole('textbox');
    await user.type(messageField, 'Test feedback message');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeEnabled();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    renderWithProviders(<FeedbackDialog open={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting feedback type from dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog open={true} onClose={jest.fn()} />);

    // Open the select dropdown
    const typeSelect = screen.getByRole('combobox');
    await user.click(typeSelect);

    // Options should be visible
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(3);
  });
});
