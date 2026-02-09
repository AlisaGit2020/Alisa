import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SettingsMenu from './SettingsMenu';
import { SettingsPage } from '../Settings';

describe('SettingsMenu', () => {
  const defaultProps = {
    onClick: jest.fn(),
    selectedItem: SettingsPage.ExpenseTypes,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all menu items', () => {
      renderWithProviders(<SettingsMenu {...defaultProps} />);

      // Check for menu items by translated text
      expect(screen.getByText('Expense types')).toBeInTheDocument();
      expect(screen.getByText('Income types')).toBeInTheDocument();
      expect(screen.getByText('Loan settings')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('renders menu icons', () => {
      renderWithProviders(<SettingsMenu {...defaultProps} />);

      expect(screen.getByTestId('PaymentIcon')).toBeInTheDocument();
      expect(screen.getByTestId('MonetizationOnIcon')).toBeInTheDocument();
      expect(screen.getByTestId('AccountBalanceIcon')).toBeInTheDocument();
      expect(screen.getByTestId('PaletteIcon')).toBeInTheDocument();
    });

    it('renders as Paper container', () => {
      const { container } = renderWithProviders(<SettingsMenu {...defaultProps} />);

      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
    });

    it('renders a MenuList', () => {
      renderWithProviders(<SettingsMenu {...defaultProps} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('Selection state', () => {
    it('highlights ExpenseTypes when selected', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={SettingsPage.ExpenseTypes} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      // ExpenseTypes is the first menu item
      expect(menuItems[0]).toHaveClass('Mui-selected');
    });

    it('highlights IncomeTypes when selected', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={SettingsPage.IncomeTypes} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      // IncomeTypes is the second menu item
      expect(menuItems[1]).toHaveClass('Mui-selected');
    });

    it('highlights LoanSettings when selected', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={SettingsPage.LoanSettings} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      // LoanSettings is the third menu item
      expect(menuItems[2]).toHaveClass('Mui-selected');
    });

    it('highlights Theme when selected', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={SettingsPage.Theme} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      // Theme is the fourth menu item
      expect(menuItems[3]).toHaveClass('Mui-selected');
    });

    it('has no selection when selectedItem is undefined', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={undefined} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        expect(item).not.toHaveClass('Mui-selected');
      });
    });
  });

  describe('User interactions', () => {
    it('calls onClick with ExpenseTypes when ExpenseTypes is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenu {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByText('Expense types'));

      expect(mockOnClick).toHaveBeenCalledWith(SettingsPage.ExpenseTypes);
    });

    it('calls onClick with IncomeTypes when IncomeTypes is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenu {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByText('Income types'));

      expect(mockOnClick).toHaveBeenCalledWith(SettingsPage.IncomeTypes);
    });

    it('calls onClick with LoanSettings when LoanSettings is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenu {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByText('Loan settings'));

      expect(mockOnClick).toHaveBeenCalledWith(SettingsPage.LoanSettings);
    });

    it('calls onClick with Theme when Theme is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <SettingsMenu {...defaultProps} onClick={mockOnClick} />
      );

      await user.click(screen.getByText('Theme'));

      expect(mockOnClick).toHaveBeenCalledWith(SettingsPage.Theme);
    });
  });

});
