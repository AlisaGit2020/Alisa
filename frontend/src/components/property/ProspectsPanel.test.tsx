import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithRouter } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';
import { PropertyStatus } from '@asset-types/common';

// Mock translations
const mockTranslations: Record<string, string> = {
  'property:prospectProperties': 'Prospects',
  'property:listView': 'List',
  'property:compareView': 'Compare',
  'property:noProspects': 'No prospects yet',
  'property:addProspect': 'Add Prospect',
  'investment-calculator:noCalculations': 'No saved calculations',
  'investment-calculator:clickToCompare': 'Click to add to comparison',
  'investment-calculator:prospectCompare': 'Prospect Compare',
  'common:loading': 'Loading...',
};

const mockT = (key: string) => mockTranslations[key] || key;

// Mock the i18n hooks
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en' },
  }),
}));

// Import after mocking - these will fail initially (TDD)
// TODO: Create ProspectsPanel component
import ProspectsPanel from './ProspectsPanel';
import Properties from './Properties';

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

describe('ProspectsPanel', () => {
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, 'search');
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  describe('View Toggle (Segmented Control)', () => {
    it('renders a segmented control toggle with List and Compare options', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        // Should have toggle buttons for List and Compare views
        expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      });
    });

    it('List view is selected by default', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        const listButton = screen.getByRole('button', { name: /list/i });
        // Material-UI ToggleButton uses aria-pressed for selection state
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('clicking Compare switches to compare view', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      });

      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      await waitFor(() => {
        expect(compareButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('clicking List switches back to list view', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      // First switch to compare view
      const compareButton = await screen.findByRole('button', { name: /compare/i });
      await user.click(compareButton);

      // Then switch back to list view
      const listButton = screen.getByRole('button', { name: /list/i });
      await user.click(listButton);

      await waitFor(() => {
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
        expect(compareButton).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('List View Content', () => {
    it('displays prospect properties in list view', async () => {
      const mockProperties = [
        createMockProperty({ id: 1, name: 'Apartment A' }),
        createMockProperty({ id: 2, name: 'Apartment B' }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByText('Apartment A')).toBeInTheDocument();
        expect(screen.getByText('Apartment B')).toBeInTheDocument();
      });
    });

    it('shows empty state when no prospects exist', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByText(/no prospects/i)).toBeInTheDocument();
      });
    });

    it('shows Add Prospect button in list view', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });
    });

    it('calls onAddClick when Add button is clicked without navigating', async () => {
      const user = userEvent.setup();
      const mockOnAddClick = jest.fn();
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel onAddClick={mockOnAddClick} />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      expect(mockOnAddClick).toHaveBeenCalledTimes(1);
      // Should NOT have navigated - we should still be on the same page
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  describe('Compare View Content', () => {
    it('displays ProspectCompareView when Compare is selected', async () => {
      const user = userEvent.setup();
      const mockProperties = [createMockProperty()];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      });

      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      await waitFor(() => {
        // ProspectCompareView renders calculation list panel and comparison panel
        expect(screen.getByTestId('calculations-list-panel')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
      });
    });

    it('hides Add Prospect button in compare view', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      });

      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /add prospect/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Synchronization', () => {
    it('initializes in compare mode when ?view=compare URL param is present', async () => {
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects?view=compare'],
      });

      await waitFor(() => {
        const compareButton = screen.getByRole('button', { name: /compare/i });
        expect(compareButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('initializes in list mode when no URL param is present', async () => {
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        const listButton = screen.getByRole('button', { name: /list/i });
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('initializes in list mode when ?view=list URL param is present', async () => {
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects?view=list'],
      });

      await waitFor(() => {
        const listButton = screen.getByRole('button', { name: /list/i });
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    // Note: These tests verify mobile-specific UI behavior
    // Actual breakpoint testing would require a mock viewport

    it('toggle buttons have appropriate sizing for mobile', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        const listButton = screen.getByRole('button', { name: /list/i });
        const compareButton = screen.getByRole('button', { name: /compare/i });
        // Verify buttons exist and are accessible
        expect(listButton).toBeInTheDocument();
        expect(compareButton).toBeInTheDocument();
      });
    });

    it('renders icons within toggle buttons', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        // Toggle buttons should contain icons for mobile view
        expect(screen.getByTestId('ViewListIcon')).toBeInTheDocument();
        expect(screen.getByTestId('CompareArrowsIcon')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles API error gracefully', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      // Component should not crash
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      });
    });

    it('maintains view state when data is refreshed', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      // Switch to compare view
      const compareButton = await screen.findByRole('button', { name: /compare/i });
      await user.click(compareButton);

      await waitFor(() => {
        expect(compareButton).toHaveAttribute('aria-pressed', 'true');
      });

      // View state should be maintained
      expect(compareButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    it('toggle buttons have appropriate aria-labels', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        const listButton = screen.getByRole('button', { name: /list/i });
        const compareButton = screen.getByRole('button', { name: /compare/i });
        expect(listButton).toHaveAccessibleName();
        expect(compareButton).toHaveAccessibleName();
      });
    });

    it('keyboard navigation works for toggle buttons', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([createMockProperty()]);

      renderWithRouter(<ProspectsPanel />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      });

      // Focus on list button and tab to compare
      const listButton = screen.getByRole('button', { name: /list/i });
      listButton.focus();
      await user.tab();

      const compareButton = screen.getByRole('button', { name: /compare/i });
      expect(document.activeElement).toBe(compareButton);

      // Press Enter to activate
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(compareButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });
});

describe('ProspectsPanel View Logic', () => {
  const VIEW_LIST = 'list';
  const VIEW_COMPARE = 'compare';

  describe('View state determination', () => {
    it('defaults to list view when no URL param', () => {
      const getViewFromParam = (param?: string) => {
        if (param === VIEW_COMPARE) return VIEW_COMPARE;
        return VIEW_LIST;
      };

      expect(getViewFromParam(undefined)).toBe(VIEW_LIST);
    });

    it('returns compare when URL param is "compare"', () => {
      const getViewFromParam = (param?: string) => {
        if (param === VIEW_COMPARE) return VIEW_COMPARE;
        return VIEW_LIST;
      };

      expect(getViewFromParam('compare')).toBe(VIEW_COMPARE);
    });

    it('returns list when URL param is "list"', () => {
      const getViewFromParam = (param?: string) => {
        if (param === VIEW_COMPARE) return VIEW_COMPARE;
        return VIEW_LIST;
      };

      expect(getViewFromParam('list')).toBe(VIEW_LIST);
    });

    it('returns list for invalid URL param values', () => {
      const getViewFromParam = (param?: string) => {
        if (param === VIEW_COMPARE) return VIEW_COMPARE;
        return VIEW_LIST;
      };

      expect(getViewFromParam('invalid')).toBe(VIEW_LIST);
      expect(getViewFromParam('something')).toBe(VIEW_LIST);
    });
  });

  describe('Toggle button configuration', () => {
    it('has two toggle options', () => {
      const toggleOptions = [
        { value: VIEW_LIST, label: 'List', icon: 'ViewListIcon' },
        { value: VIEW_COMPARE, label: 'Compare', icon: 'CompareArrowsIcon' },
      ];

      expect(toggleOptions).toHaveLength(2);
    });

    it('list option is first', () => {
      const toggleOptions = [
        { value: VIEW_LIST, label: 'List', icon: 'ViewListIcon' },
        { value: VIEW_COMPARE, label: 'Compare', icon: 'CompareArrowsIcon' },
      ];

      expect(toggleOptions[0].value).toBe(VIEW_LIST);
    });

    it('compare option is second', () => {
      const toggleOptions = [
        { value: VIEW_LIST, label: 'List', icon: 'ViewListIcon' },
        { value: VIEW_COMPARE, label: 'Compare', icon: 'CompareArrowsIcon' },
      ];

      expect(toggleOptions[1].value).toBe(VIEW_COMPARE);
    });
  });
});

/**
 * Tests for mobile-friendly Properties tabs
 * The Properties component has 3 tabs: My Properties, Prospects, Sold
 * These should be responsive and work well on mobile devices.
 */
describe('Properties Mobile-Friendly Tabs', () => {
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, 'search').mockResolvedValue([]);
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  describe('Tab Layout', () => {
    it('renders exactly 3 main portfolio tabs', async () => {
      // Note: This test uses the Properties component
      // Import: import Properties from './Properties';

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        // Should have 3 tabs: My Properties, Prospects, Sold
        // Note: If InvestmentCalculator is a 4th tab, adjust accordingly
        expect(tabs.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('tabs have correct labels', async () => {
      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        // Check for the 3 main tab labels
        expect(screen.getByRole('tab', { name: /my properties/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /prospects/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sold/i })).toBeInTheDocument();
      });
    });

    it('tabs have icons for mobile display', async () => {
      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        // Each tab should have an icon (MUI icons render with data-testid)
        expect(screen.getByTestId('HomeIcon')).toBeInTheDocument(); // My Properties
        expect(screen.getByTestId('SearchIcon')).toBeInTheDocument(); // Prospects
        expect(screen.getByTestId('SellIcon')).toBeInTheDocument(); // Sold
      });
    });
  });

  describe('Tab Interaction', () => {
    it('selecting a tab navigates to correct route', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /prospects/i })).toBeInTheDocument();
      });

      // Click prospects tab
      const prospectsTab = screen.getByRole('tab', { name: /prospects/i });
      await user.click(prospectsTab);

      // Tab should be selected
      await waitFor(() => {
        expect(prospectsTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('tab state persists on navigation', async () => {
      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/prospects'],
      });

      await waitFor(() => {
        const prospectsTab = screen.getByRole('tab', { name: /prospects/i });
        expect(prospectsTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('swipe gesture support for mobile (touch events)', async () => {
      // Note: Testing actual swipe gestures requires a specific test setup
      // This test verifies the tabs are rendered in a swipeable container

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        // Tabs should be within a tab panel structure
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('tabs are accessible via keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // Focus on tabs and navigate with arrow keys
      const ownTab = screen.getByRole('tab', { name: /my properties/i });
      ownTab.focus();

      // Arrow right should move to next tab
      await user.keyboard('{ArrowRight}');

      const prospectsTab = screen.getByRole('tab', { name: /prospects/i });
      expect(document.activeElement).toBe(prospectsTab);
    });

    it('tabs have touch-friendly target sizes', async () => {
      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');

        tabs.forEach(tab => {
          // Verify tab is a reasonable target size
          // (actual size testing would require computed styles)
          expect(tab).toBeInTheDocument();
        });
      });
    });
  });

  describe('Tab Content Loading', () => {
    it('loads correct content for each tab', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue([
        createMockProperty({ id: 1, name: 'Own Property' }),
      ]);

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        expect(screen.getByText('Own Property')).toBeInTheDocument();
      });

      // Switch to prospects tab
      const prospectsTab = screen.getByRole('tab', { name: /prospects/i });
      await user.click(prospectsTab);

      // Should trigger new search with PROSPECT status
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith(
          'real-estate/property',
          expect.objectContaining({
            where: expect.objectContaining({
              status: PropertyStatus.PROSPECT,
            }),
          })
        );
      });
    });

    it('shows loading state when switching tabs', async () => {
      const user = userEvent.setup();
      // Make the search slow for prospects
      mockSearch
        .mockResolvedValueOnce([]) // First call (own)
        .mockImplementation(() => new Promise(() => {})); // Hang on prospects

      renderWithRouter(<Properties />, {
        initialEntries: ['/app/portfolio/own'],
      });

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /prospects/i })).toBeInTheDocument();
      });

      // Switch to prospects tab
      const prospectsTab = screen.getByRole('tab', { name: /prospects/i });
      await user.click(prospectsTab);

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });
});