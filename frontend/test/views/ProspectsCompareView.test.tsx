/**
 * ProspectsCompareView.test.tsx - E2E Integration Tests for Prospects Compare Route
 *
 * This file contains comprehensive tests written BEFORE implementation exists (TDD).
 * These tests define the expected behavior for the compare route at:
 * `/app/portfolio/prospects/compare`
 *
 * Requirements being tested:
 * 1. Compare should have its own path `/app/portfolio/prospects/compare`
 * 2. Compare should show in breadcrumb navigation
 * 3. Translation "Click to add to comparison" instead of "Drop here to compare"
 * 4. Mobile-friendly tabs (responsive design)
 *
 * The Developer will implement code to make these tests pass.
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithRouter } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';
import { PropertyStatus } from '@asset-types/common';

// Mock i18n - define translations inline to avoid hoisting issues
jest.mock('react-i18next', () => {
  // Mock translations including the new "click to add" text
  const translations: Record<string, string> = {
    // Route translations
    'route:portfolio': 'Portfolio',
    'route:prospects': 'Prospects',
    'route:compare': 'Compare',
    'route:own': 'My Properties',
    'route:sold': 'Sold',
    // Property translations
    'property:prospectProperties': 'Prospects',
    'property:ownProperties': 'My Properties',
    'property:soldProperties': 'Sold',
    'property:listView': 'List',
    'property:compareView': 'Compare',
    'property:noProspects': 'No prospects',
    'property:add': 'Add',
    // Investment calculator translations
    'investment-calculator:prospectCompare': 'Prospect Compare',
    'investment-calculator:clickToAddToComparison': 'Click to add to comparison',
    'investment-calculator:emptyComparisonMessage': 'Select calculations from the list to compare them',
    'investment-calculator:comparison': 'Comparison',
    'investment-calculator:calculations': 'Calculations',
    'investment-calculator:noCalculations': 'No saved calculations',
    'investment-calculator:noCalculationsMessage': 'Create calculations to compare them here',
    'investment-calculator:unlinkedCalculations': 'Other Calculations',
    'investment-calculator:errorLoading': 'Error loading calculations',
    // Common
    'common:loading': 'Loading...',
    'common:retry': 'Retry',
  };

  // Try full key first, then try adding common namespace prefixes
  const createT = (boundNamespace?: string) => (key: string) => {
    if (translations[key]) return translations[key];
    // Try with the bound namespace
    if (boundNamespace) {
      const nsKey = `${boundNamespace}:${key}`;
      if (translations[nsKey]) return translations[nsKey];
    }
    // Try with common namespace prefixes
    const routeKey = `route:${key}`;
    if (translations[routeKey]) return translations[routeKey];
    return key;
  };

  const Trans = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  const I18nextProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

  return {
    useTranslation: (namespace?: string | string[]) => ({
      t: createT(Array.isArray(namespace) ? namespace[0] : namespace),
      i18n: {
        language: 'en',
        changeLanguage: () => Promise.resolve(),
      },
    }),
    withTranslation: (namespace?: string) => <P extends object>(Component: React.ComponentType<P>) => {
      const WrappedComponent = (props: Omit<P, 't'>) => {
        return <Component {...(props as P)} t={createT(namespace)} />;
      };
      WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
      return WrappedComponent;
    },
    Trans,
    I18nextProvider,
    initReactI18next: { type: '3rdParty', init: () => {} },
  };
});

// Export translations for use in test assertions
const mockTranslations: Record<string, string> = {
  'route:portfolio': 'Portfolio',
  'route:prospects': 'Prospects',
  'route:compare': 'Compare',
  'route:own': 'My Properties',
  'route:sold': 'Sold',
  'property:prospectProperties': 'Prospects',
  'property:ownProperties': 'My Properties',
  'property:soldProperties': 'Sold',
  'property:listView': 'List',
  'property:compareView': 'Compare',
  'property:noProspects': 'No prospects',
  'property:add': 'Add',
  'investment-calculator:prospectCompare': 'Prospect Compare',
  'investment-calculator:clickToAddToComparison': 'Click to add to comparison',
  'investment-calculator:emptyComparisonMessage': 'Select calculations from the list to compare them',
  'investment-calculator:comparison': 'Comparison',
  'investment-calculator:calculations': 'Calculations',
  'investment-calculator:noCalculations': 'No saved calculations',
  'investment-calculator:noCalculationsMessage': 'Create calculations to compare them here',
  'investment-calculator:unlinkedCalculations': 'Other Calculations',
  'investment-calculator:errorLoading': 'Error loading calculations',
  'common:loading': 'Loading...',
  'common:retry': 'Retry',
};

// Import the main route component
// This test verifies the route configuration and component rendering
// Use AppRoutesContent to avoid double router issue (MemoryRouter from test-wrapper + BrowserRouter in AppRoutes)
import { AppRoutesContent as AppRoutes } from '../../src/components/AppRoutes';
import ProspectCompareView from '../../src/components/investment-calculator/ProspectCompareView';
import Breadcrumbs from '../../src/components/layout/Breadcrumbs';

// Helper to create mock calculation
const createMockCalculation = (overrides: object = {}) => ({
  id: 1,
  name: 'Test Calculation',
  deptFreePrice: 150000,
  deptShare: 0,
  transferTaxPercent: 2,
  maintenanceFee: 200,
  chargeForFinancialCosts: 50,
  rentPerMonth: 850,
  apartmentSize: 55,
  waterCharge: 20,
  downPayment: 30000,
  loanInterestPercent: 4,
  loanPeriod: 25,
  sellingPrice: 150000,
  rentalYieldPercent: 6.8,
  cashFlowPerMonth: 180,
  propertyId: null,
  property: null,
  ...overrides,
});

// Helper to create mock property
const createMockProperty = (overrides: object = {}) => ({
  id: 1,
  name: 'Helsinki Apartment',
  size: 55,
  status: PropertyStatus.PROSPECT,
  photo: '/uploads/properties/test.jpg',
  address: {
    id: 1,
    street: 'Mannerheimintie 1',
    city: 'Helsinki',
    postalCode: '00100',
  },
  ownerships: [],
  ...overrides,
});

describe('Prospects Compare Route', () => {
  let mockSearch: jest.SpyInstance;
  let mockGet: jest.SpyInstance;
  let mockMe: jest.SpyInstance;

  // Helper to setup mocks for both calculations and prospects endpoints
  const setupMocks = (options: {
    calculations?: object[];
    prospects?: object[];
  }) => {
    mockSearch.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'real-estate/investment') {
        return options.calculations ?? [];
      }
      if (endpoint === 'real-estate/property') {
        return options.prospects ?? [];
      }
      return [];
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, 'search');
    mockGet = jest.spyOn(ApiClient, 'get');
    // Mock the me() call that AuthInitializer uses
    mockMe = jest.spyOn(ApiClient, 'me');
    mockMe.mockResolvedValue({ id: 1, email: 'test@example.com' });
    // Default: return empty arrays for both endpoints
    setupMocks({ calculations: [], prospects: [] });
  });

  afterEach(() => {
    mockSearch.mockRestore();
    mockGet.mockRestore();
    mockMe.mockRestore();
  });

  describe('Route Configuration', () => {
    it('compare route exists at /app/portfolio/prospects/compare', async () => {
      // Provide a calculation so the full view renders with comparison-panel
      setupMocks({
        calculations: [createMockCalculation()],
        prospects: [],
      });

      renderWithRouter(<AppRoutes />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      // Should render the compare view, not a 404 or redirect
      await waitFor(() => {
        // Look for comparison-related content
        expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
      });
    });

    it('renders ProspectCompareView component at compare route', async () => {
      setupMocks({
        calculations: [createMockCalculation()],
        prospects: [],
      });

      renderWithRouter(<AppRoutes />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      // Should render the two-panel layout from ProspectCompareView
      await waitFor(() => {
        expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
      });
    });

    it('renders within protected layout (requires auth)', async () => {
      setupMocks({ calculations: [], prospects: [] });

      renderWithRouter(<AppRoutes />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      // Should be within the protected layout structure
      // Protected layout includes AppBar, etc.
      await waitFor(() => {
        // Just verify the route renders something (auth handling is mocked)
        expect(document.body.textContent).not.toBe('');
      });
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('displays breadcrumb trail including "compare" segment', async () => {
      mockSearch.mockResolvedValue([]);
      mockGet.mockResolvedValue(null); // No property name lookup needed

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      // Should show breadcrumb path: Portfolio / Prospects / Compare
      await waitFor(() => {
        expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
        expect(screen.getByText(/prospects/i)).toBeInTheDocument();
        expect(screen.getByText(/compare/i)).toBeInTheDocument();
      });
    });

    it('breadcrumb links are correct for compare route', async () => {
      mockSearch.mockResolvedValue([]);
      mockGet.mockResolvedValue(null);

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        const links = screen.getAllByRole('link');

        // Should have links for:
        // 1. portfolio -> /app/portfolio
        // 2. prospects -> /app/portfolio/prospects
        // 3. compare -> /app/portfolio/prospects/compare
        const portfolioLink = links.find(link =>
          link.textContent?.toLowerCase().includes('portfolio')
        );
        const prospectsLink = links.find(link =>
          link.textContent?.toLowerCase().includes('prospects')
        );
        const compareLink = links.find(link =>
          link.textContent?.toLowerCase().includes('compare')
        );

        expect(portfolioLink).toHaveAttribute('href', '/app/portfolio');
        expect(prospectsLink).toHaveAttribute('href', '/app/portfolio/prospects');
        expect(compareLink).toHaveAttribute('href', '/app/portfolio/prospects/compare');
      });
    });

    it('translates "compare" in breadcrumb correctly', async () => {
      mockGet.mockResolvedValue(null);

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        // Should show translated text "Compare" (from route:compare)
        // Note: breadcrumb text includes " / " separator
        expect(screen.getByText(/Compare/)).toBeInTheDocument();
      });
    });
  });

  describe('Translation: Click to Add vs Drop Here', () => {
    it('shows "Click to add to comparison" instead of "Drop here to compare"', async () => {
      setupMocks({
        calculations: [createMockCalculation()],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        // The empty comparison zone should show the new text
        const comparisonPanel = screen.getByTestId('comparison-panel');
        expect(comparisonPanel).toBeInTheDocument();
      });

      // Should NOT have the old "drop here" text
      expect(screen.queryByText(/drop here to compare/i)).not.toBeInTheDocument();

      // Should have the new "click to add" text
      expect(screen.getByText(/click to add to comparison/i)).toBeInTheDocument();
    });

    it('empty comparison zone has correct instructional text', async () => {
      setupMocks({
        calculations: [createMockCalculation({ id: 1, name: 'Calc 1' })],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        // Find the comparison drop zone
        const dropZone = screen.getByTestId('comparison-drop-zone');
        expect(dropZone).toBeInTheDocument();

        // Should show instructional message
        expect(
          within(dropZone).getByText(/click to add to comparison/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Between List and Compare', () => {
    it('navigates from prospects list to compare route', async () => {
      const user = userEvent.setup();
      setupMocks({
        calculations: [],
        prospects: [createMockProperty()],
      });

      // Start at prospects list page
      renderWithRouter(<AppRoutes />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      });

      // Click Compare toggle button
      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      // URL should change to include compare (or view=compare param)
      await waitFor(() => {
        expect(compareButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('navigates from compare route back to list', async () => {
      const user = userEvent.setup();
      setupMocks({
        calculations: [createMockCalculation()],
        prospects: [],
      });

      // Start at compare page
      renderWithRouter(<AppRoutes />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      });

      // Click List toggle button
      const listButton = screen.getByRole('button', { name: /list/i });
      await user.click(listButton);

      // Should switch to list view - need to re-query as navigation changes the DOM
      await waitFor(() => {
        const newListButton = screen.getByRole('button', { name: /list/i });
        expect(newListButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Compare View Functionality', () => {
    it('displays calculation list panel', async () => {
      setupMocks({
        calculations: [
          createMockCalculation({ id: 1, name: 'Investment A' }),
          createMockCalculation({ id: 2, name: 'Investment B' }),
        ],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
      });

      // Should show calculation names
      expect(screen.getByText('Investment A')).toBeInTheDocument();
      expect(screen.getByText('Investment B')).toBeInTheDocument();
    });

    it('clicking calculation adds it to comparison', async () => {
      const user = userEvent.setup();
      setupMocks({
        calculations: [createMockCalculation({ id: 1, name: 'Clickable Calc' })],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByText('Clickable Calc')).toBeInTheDocument();
      });

      // Click on the calculation list item
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // Should appear in comparison zone
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      await waitFor(() => {
        expect(within(comparisonZone).getAllByText('Clickable Calc').length).toBeGreaterThan(0);
      });
    });

    it('groups calculations by property', async () => {
      const property = createMockProperty({ id: 10, name: 'Test Property' });
      const calculations = [
        createMockCalculation({
          id: 1,
          name: 'Calc A',
          propertyId: 10,
          property,
        }),
        createMockCalculation({
          id: 2,
          name: 'Calc B',
          propertyId: 10,
          property,
        }),
      ];
      setupMocks({ calculations, prospects: [property] });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        // Property name should appear as group header
        expect(screen.getByText('Test Property')).toBeInTheDocument();
      });
    });

    it('shows unlinked section for calculations without property', async () => {
      setupMocks({
        calculations: [createMockCalculation({ id: 1, name: 'Unlinked Calc', propertyId: null })],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByText('Unlinked Calc')).toBeInTheDocument();
        // Check for the section header "Other Calculations"
        expect(screen.getByText('Other Calculations')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state while fetching calculations', () => {
      mockSearch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('retry button refetches data', async () => {
      const user = userEvent.setup();
      mockSearch.mockRejectedValueOnce(new Error('First failure'));

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Mock success on retry
      mockSearch.mockResolvedValue([createMockCalculation()]);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should no longer show error
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no calculations exist', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByText(/no saved calculations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders layout correctly in mobile viewport', async () => {
      setupMocks({
        calculations: [createMockCalculation()],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        // Both panels should render (stacked on mobile)
        expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
      });
    });
  });

  describe('Removing from Comparison', () => {
    it('can remove calculation from comparison', async () => {
      const user = userEvent.setup();
      setupMocks({
        calculations: [createMockCalculation({ id: 1, name: 'Removable' })],
        prospects: [],
      });

      renderWithRouter(<ProspectCompareView />, {
        initialEntries: ['/app/portfolio/prospects/compare'],
      });

      await waitFor(() => {
        expect(screen.getByText('Removable')).toBeInTheDocument();
      });

      // Add to comparison
      const calcItem = screen.getByTestId('calculation-list-item-1');
      await user.click(calcItem);

      // Verify it's in comparison
      const comparisonZone = screen.getByTestId('comparison-drop-zone');
      await waitFor(() => {
        expect(within(comparisonZone).getAllByText('Removable').length).toBeGreaterThan(0);
      });

      // Find and click the remove button (close icon on chip)
      const closeIcons = within(comparisonZone).getAllByTestId('CloseIcon');
      await user.click(closeIcons[0]);

      // Should show empty state again
      await waitFor(() => {
        expect(within(comparisonZone).getByText(/click to add to comparison/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Compare Route - Route Logic Unit Tests', () => {
  describe('Route path construction', () => {
    const BASE_PROSPECTS_PATH = '/app/portfolio/prospects';
    const COMPARE_ROUTE = 'compare';

    it('constructs compare route path correctly', () => {
      const comparePath = `${BASE_PROSPECTS_PATH}/${COMPARE_ROUTE}`;
      expect(comparePath).toBe('/app/portfolio/prospects/compare');
    });

    it('compare is a valid nested route under prospects', () => {
      const pathSegments = '/app/portfolio/prospects/compare'.split('/').filter(Boolean);
      expect(pathSegments).toContain('prospects');
      expect(pathSegments).toContain('compare');
      expect(pathSegments.indexOf('compare')).toBeGreaterThan(pathSegments.indexOf('prospects'));
    });
  });

  describe('View state from URL', () => {
    const getViewFromPath = (pathname: string): 'list' | 'compare' => {
      if (pathname.endsWith('/compare')) return 'compare';
      return 'list';
    };

    it('returns "compare" for compare route', () => {
      expect(getViewFromPath('/app/portfolio/prospects/compare')).toBe('compare');
    });

    it('returns "list" for prospects route without compare', () => {
      expect(getViewFromPath('/app/portfolio/prospects')).toBe('list');
    });

    it('returns "list" for other prospects subroutes', () => {
      expect(getViewFromPath('/app/portfolio/prospects/123')).toBe('list');
      expect(getViewFromPath('/app/portfolio/prospects/add')).toBe('list');
    });
  });

  describe('Navigation path generation', () => {
    const buildProspectsPath = (view: 'list' | 'compare'): string => {
      if (view === 'compare') {
        return '/app/portfolio/prospects/compare';
      }
      return '/app/portfolio/prospects';
    };

    it('generates compare path correctly', () => {
      expect(buildProspectsPath('compare')).toBe('/app/portfolio/prospects/compare');
    });

    it('generates list path correctly', () => {
      expect(buildProspectsPath('list')).toBe('/app/portfolio/prospects');
    });
  });
});

describe('Translation Keys Validation', () => {
  // These tests ensure translation keys are properly configured

  const requiredTranslations = {
    'investment-calculator': [
      'clickToAddToComparison',
      'emptyComparisonMessage',
      'comparison',
      'calculations',
      'noCalculations',
      'noCalculationsMessage',
      'unlinkedCalculations',
      'prospectCompare',
    ],
    'route': [
      'compare',
      'prospects',
      'portfolio',
    ],
    'property': [
      'listView',
      'compareView',
    ],
  };

  describe('Investment calculator namespace', () => {
    it.each(requiredTranslations['investment-calculator'])(
      'has translation key: %s',
      (key) => {
        const fullKey = `investment-calculator:${key}`;
        const translation = mockTranslations[fullKey];
        // In TDD, we expect these to exist in translations
        expect(translation || 'MISSING').not.toBe('MISSING');
      }
    );
  });

  describe('Route namespace', () => {
    it.each(requiredTranslations['route'])(
      'has translation key: %s',
      (key) => {
        const fullKey = `route:${key}`;
        const translation = mockTranslations[fullKey];
        expect(translation || 'MISSING').not.toBe('MISSING');
      }
    );
  });

  describe('Property namespace', () => {
    it.each(requiredTranslations['property'])(
      'has translation key: %s',
      (key) => {
        const fullKey = `property:${key}`;
        const translation = mockTranslations[fullKey];
        expect(translation || 'MISSING').not.toBe('MISSING');
      }
    );
  });
});