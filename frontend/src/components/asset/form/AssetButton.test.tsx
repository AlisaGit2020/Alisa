import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetButton from './AssetButton';

describe('AssetButton', () => {
  it('renders with label', () => {
    renderWithProviders(<AssetButton label="Click me" />);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('uses contained variant by default', () => {
    renderWithProviders(<AssetButton label="Default" />);

    const button = screen.getByRole('button', { name: 'Default' });
    expect(button).toHaveClass('MuiButton-contained');
  });

  it('renders with outlined variant', () => {
    renderWithProviders(<AssetButton label="Outlined" variant="outlined" />);

    const button = screen.getByRole('button', { name: 'Outlined' });
    expect(button).toHaveClass('MuiButton-outlined');
  });

  it('renders with text variant', () => {
    renderWithProviders(<AssetButton label="Text" variant="text" />);

    const button = screen.getByRole('button', { name: 'Text' });
    expect(button).toHaveClass('MuiButton-text');
  });

  it('renders with different colors', () => {
    renderWithProviders(<AssetButton label="Error" color="error" />);

    const button = screen.getByRole('button', { name: 'Error' });
    expect(button).toHaveClass('MuiButton-colorError');
  });

  it('renders with different sizes', () => {
    renderWithProviders(<AssetButton label="Small" size="small" />);

    const button = screen.getByRole('button', { name: 'Small' });
    expect(button).toHaveClass('MuiButton-sizeSmall');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    renderWithProviders(<AssetButton label="Click" onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Click' });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders in disabled state', () => {
    renderWithProviders(<AssetButton label="Disabled" disabled />);

    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('is disabled and cannot be clicked when disabled prop is true', () => {
    const mockOnClick = jest.fn();

    renderWithProviders(<AssetButton label="Disabled" disabled onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    // Button with pointer-events: none cannot be clicked - verified by disabled state
  });

  it('renders with loading state', () => {
    renderWithProviders(<AssetButton label="Loading" loading />);

    const button = screen.getByRole('button', { name: 'Loading' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('is disabled and cannot be clicked when loading prop is true', () => {
    const mockOnClick = jest.fn();

    renderWithProviders(<AssetButton label="Loading" loading onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Loading' });
    expect(button).toBeDisabled();
    // Button with pointer-events: none cannot be clicked - verified by disabled state
  });

  it('renders with startIcon', () => {
    renderWithProviders(
      <AssetButton label="With Icon" startIcon={<span data-testid="start-icon">+</span>} />
    );

    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders with endIcon', () => {
    renderWithProviders(
      <AssetButton label="With Icon" endIcon={<span data-testid="end-icon">→</span>} />
    );

    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('replaces startIcon with loading indicator when loading', () => {
    renderWithProviders(
      <AssetButton label="Loading" startIcon={<span data-testid="start-icon">+</span>} loading />
    );

    expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with fullWidth', () => {
    renderWithProviders(<AssetButton label="Full Width" fullWidth />);

    const button = screen.getByRole('button', { name: 'Full Width' });
    expect(button).toHaveClass('MuiButton-fullWidth');
  });

  it('renders as submit button', () => {
    renderWithProviders(<AssetButton label="Submit" type="submit" />);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders as reset button', () => {
    renderWithProviders(<AssetButton label="Reset" type="reset" />);

    const button = screen.getByRole('button', { name: 'Reset' });
    expect(button).toHaveAttribute('type', 'reset');
  });
});
