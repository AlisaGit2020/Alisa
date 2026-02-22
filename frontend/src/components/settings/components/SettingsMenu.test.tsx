import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SettingsMenu from './SettingsMenu';
import { SettingsPage } from '../Settings';

describe('SettingsMenu', () => {
  const defaultProps = {
    onClick: jest.fn(),
    selectedItem: SettingsPage.Theme,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders theme menu item', () => {
      renderWithProviders(<SettingsMenu {...defaultProps} />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('renders theme menu icon', () => {
      renderWithProviders(<SettingsMenu {...defaultProps} />);

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
    it('highlights Theme when selected', () => {
      renderWithProviders(
        <SettingsMenu {...defaultProps} selectedItem={SettingsPage.Theme} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveClass('Mui-selected');
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
