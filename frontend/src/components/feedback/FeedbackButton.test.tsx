import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import FeedbackButton from './FeedbackButton';

describe('FeedbackButton', () => {
  it('renders a floating action button', () => {
    renderWithProviders(<FeedbackButton />);

    const fab = screen.getByRole('button');
    expect(fab).toBeInTheDocument();
  });

  it('opens dialog when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackButton />);

    const fab = screen.getByRole('button');
    await user.click(fab);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dialog contains feedback form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackButton />);

    const fab = screen.getByRole('button');
    await user.click(fab);

    // Dialog should contain form elements
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
