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
import { ThemeContextProvider, useThemeMode } from '@alisa-lib/theme-context';
import ThemeSettings from './ThemeSettings';

// Custom wrapper that includes ThemeContextProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  const theme = createTheme();

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <I18nextProvider i18n={i18n}>
            <ThemeContextProvider>{children}</ThemeContextProvider>
          </I18nextProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function renderWithThemeContext(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

// Helper component to inspect theme mode
function ThemeModeInspector() {
  const { mode } = useThemeMode();
  return <span data-testid="theme-mode">{mode}</span>;
}

describe('ThemeSettings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('renders theme settings title', () => {
      renderWithThemeContext(<ThemeSettings />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('renders light theme option', () => {
      renderWithThemeContext(<ThemeSettings />);

      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('renders dark theme option', () => {
      renderWithThemeContext(<ThemeSettings />);

      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    it('renders as Paper container', () => {
      const { container } = renderWithThemeContext(<ThemeSettings />);

      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
    });

    it('renders radio buttons', () => {
      renderWithThemeContext(<ThemeSettings />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });
  });

  describe('Default state', () => {
    it('defaults to light theme', () => {
      renderWithThemeContext(<ThemeSettings />);

      const lightRadio = screen.getByLabelText('Light');
      expect(lightRadio).toBeChecked();
    });

    it('dark theme is not selected by default', () => {
      renderWithThemeContext(<ThemeSettings />);

      const darkRadio = screen.getByLabelText('Dark');
      expect(darkRadio).not.toBeChecked();
    });
  });

  describe('Theme switching', () => {
    it('selects dark theme when dark option is clicked', async () => {
      const user = userEvent.setup();

      renderWithThemeContext(<ThemeSettings />);

      const darkRadio = screen.getByLabelText('Dark');
      await user.click(darkRadio);

      expect(darkRadio).toBeChecked();
    });

    it('selects light theme when light option is clicked after dark', async () => {
      const user = userEvent.setup();

      renderWithThemeContext(<ThemeSettings />);

      // First select dark
      const darkRadio = screen.getByLabelText('Dark');
      await user.click(darkRadio);
      expect(darkRadio).toBeChecked();

      // Then select light
      const lightRadio = screen.getByLabelText('Light');
      await user.click(lightRadio);
      expect(lightRadio).toBeChecked();
    });

    it('updates theme context when theme is changed', async () => {
      const user = userEvent.setup();

      renderWithThemeContext(
        <>
          <ThemeSettings />
          <ThemeModeInspector />
        </>
      );

      // Initial state should be light
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');

      // Switch to dark
      const darkRadio = screen.getByLabelText('Dark');
      await user.click(darkRadio);

      await waitFor(() => {
        expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      });
    });
  });

  describe('localStorage persistence', () => {
    it('saves theme to localStorage when changed', async () => {
      const user = userEvent.setup();

      renderWithThemeContext(<ThemeSettings />);

      const darkRadio = screen.getByLabelText('Dark');
      await user.click(darkRadio);

      await waitFor(() => {
        expect(localStorage.getItem('alisa-theme-mode')).toBe('dark');
      });
    });

    it('loads saved theme from localStorage', () => {
      localStorage.setItem('alisa-theme-mode', 'dark');

      renderWithThemeContext(
        <>
          <ThemeSettings />
          <ThemeModeInspector />
        </>
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByLabelText('Dark')).toBeChecked();
    });

    it('defaults to light when localStorage has invalid value', () => {
      localStorage.setItem('alisa-theme-mode', 'invalid');

      renderWithThemeContext(
        <>
          <ThemeSettings />
          <ThemeModeInspector />
        </>
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    });
  });

  describe('Accessibility', () => {
    it('has accessible radio group', () => {
      renderWithThemeContext(<ThemeSettings />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });

    it('radio buttons have correct labels', () => {
      renderWithThemeContext(<ThemeSettings />);

      expect(screen.getByLabelText('Light')).toBeInTheDocument();
      expect(screen.getByLabelText('Dark')).toBeInTheDocument();
    });
  });
});
