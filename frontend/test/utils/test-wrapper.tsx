// frontend/test/utils/test-wrapper.tsx
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/translations/i18n';
import { BrowserRouter } from 'react-router-dom';

// Create a default theme for testing
const theme = createTheme();

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all necessary contexts for testing
 */
function AllProviders({ children }: AllProvidersProps) {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <I18nextProvider i18n={i18n}>
            {children}
          </I18nextProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
