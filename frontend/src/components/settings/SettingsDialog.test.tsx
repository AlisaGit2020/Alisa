import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { I18nextProvider } from 'react-i18next';
import i18n from '@test-utils/test-i18n';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContextProvider } from '@alisa-lib/theme-context';
import { AlisaToastProvider } from '../alisa';
import SettingsDialog from './SettingsDialog';
import ApiClient from '@alisa-lib/api-client';
import DataService from '@alisa-lib/data-service';
import { createMockUser } from '@test-utils/test-data';

jest.mock('@alisa-lib/api-client');
jest.mock('@alisa-lib/data-service');

// Custom wrapper that includes ThemeContextProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  const theme = createTheme();

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <I18nextProvider i18n={i18n}>
            <AlisaToastProvider>
              <ThemeContextProvider>{children}</ThemeContextProvider>
            </AlisaToastProvider>
          </I18nextProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function renderWithThemeContext(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

describe('SettingsDialog', () => {
  const mockUser = createMockUser({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  });

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock API and DataService
    jest.spyOn(ApiClient, 'me').mockResolvedValue(mockUser);
    jest.spyOn(ApiClient, 'updateUserSettings').mockResolvedValue(mockUser);
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue([]);
    jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
      (data, name, value) => ({ ...data, [name]: value })
    );
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('does not render dialog when open is false', () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders settings title', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
      });
    });

    it('renders fullscreen toggle button', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'toggle fullscreen' })).toBeInTheDocument();
      });
    });
  });

  describe('Menu items', () => {
    it('renders theme menu item', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        // Theme appears in both menu and content area
        const elements = screen.getAllByText('Theme');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('renders theme menu icon', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('PaletteIcon')).toBeInTheDocument();
      });
    });
  });

  describe('Default page', () => {
    it('shows theme settings by default', async () => {
      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        // Theme settings content should be visible
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });
    });
  });

  describe('Close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithThemeContext(<SettingsDialog {...defaultProps} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'close' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      renderWithThemeContext(<SettingsDialog {...defaultProps} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Fullscreen toggle', () => {
    it('toggles fullscreen mode when button is clicked', async () => {
      const user = userEvent.setup();

      renderWithThemeContext(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'toggle fullscreen' })).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const toggleButton = screen.getByRole('button', { name: 'toggle fullscreen' });

      // Initial state is fullscreen
      expect(dialog).toHaveClass('MuiDialog-paperFullScreen');

      // Toggle off fullscreen
      await user.click(toggleButton);

      expect(dialog).not.toHaveClass('MuiDialog-paperFullScreen');
    });
  });
});
