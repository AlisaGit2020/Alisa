// frontend/test/utils/test-wrapper.tsx
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { I18nextProvider } from 'react-i18next';
import i18n from './test-i18n';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AssetToastProvider } from '../../src/components/asset';
import { UserProvider } from '../../src/lib/user-context';

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
            <AssetToastProvider>
              <UserProvider>
                {children}
              </UserProvider>
            </AssetToastProvider>
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

/**
 * Custom render function for components that need to test routing behavior
 * Allows setting initial route entries for MemoryRouter
 */
export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    ...renderOptions
  }: {
    initialEntries?: string[];
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <I18nextProvider i18n={i18n}>
              <AssetToastProvider>
                <UserProvider>
                  {children}
                </UserProvider>
              </AssetToastProvider>
            </I18nextProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
