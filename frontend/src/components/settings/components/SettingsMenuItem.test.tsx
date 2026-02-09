import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SettingsMenuItem from './SettingsMenuItem';
import PaymentIcon from '@mui/icons-material/Payment';

describe('SettingsMenuItem', () => {
  const defaultProps = {
    onClick: jest.fn(),
    selected: false,
    icon: <PaymentIcon fontSize="small" />,
    itemText: 'Test Menu Item',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders menu item with icon and text', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} />);

      expect(screen.getByText('Test Menu Item')).toBeInTheDocument();
      expect(screen.getByTestId('PaymentIcon')).toBeInTheDocument();
    });

    it('renders as a menu item role', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} />);

      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('shows selected state when selected prop is true', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} selected={true} />);

      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveClass('Mui-selected');
    });

    it('does not show selected state when selected prop is false', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} selected={false} />);

      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).not.toHaveClass('Mui-selected');
    });
  });

  describe('User interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenuItem {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByRole('menuitem'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with mouse event', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenuItem {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByRole('menuitem'));

      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Different icons', () => {
    it('renders with MonetizationOnIcon', async () => {
      const { default: MonetizationOnIcon } = await import('@mui/icons-material/MonetizationOn');

      renderWithProviders(
        <SettingsMenuItem
          {...defaultProps}
          icon={<MonetizationOnIcon fontSize="small" data-testid="MonetizationOnIcon" />}
        />
      );

      expect(screen.getByTestId('MonetizationOnIcon')).toBeInTheDocument();
    });

    it('renders with AccountBalanceIcon', async () => {
      const { default: AccountBalanceIcon } = await import('@mui/icons-material/AccountBalance');

      renderWithProviders(
        <SettingsMenuItem
          {...defaultProps}
          icon={<AccountBalanceIcon fontSize="small" data-testid="AccountBalanceIcon" />}
        />
      );

      expect(screen.getByTestId('AccountBalanceIcon')).toBeInTheDocument();
    });

    it('renders with PaletteIcon', async () => {
      const { default: PaletteIcon } = await import('@mui/icons-material/Palette');

      renderWithProviders(
        <SettingsMenuItem
          {...defaultProps}
          icon={<PaletteIcon fontSize="small" data-testid="PaletteIcon" />}
        />
      );

      expect(screen.getByTestId('PaletteIcon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has menuitem role', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} />);

      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('displays text content accessibly', () => {
      renderWithProviders(<SettingsMenuItem {...defaultProps} />);

      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveTextContent('Test Menu Item');
    });
  });
});
