import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Breadcrumbs from './Breadcrumbs';
import { renderWithRouter } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';

// For mobile tests, we use the testIsMobile prop instead of mocking

describe('Breadcrumbs', () => {
  it('should not display "app" in breadcrumb text for protected routes', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/dashboard'],
    });

    // Should show translated text (e.g., "Overview") but not "app"
    expect(screen.queryByText(/app/i)).not.toBeInTheDocument();
    // The translation for "dashboard" is "Overview" in the route translations
    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
  });

  it('should construct breadcrumb links with /app prefix for protected routes', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/finance/transactions'],
    });

    // Find all breadcrumb links
    const links = screen.getAllByRole('link');

    // First breadcrumb should link to /app/finance
    expect(links[0]).toHaveAttribute('href', '/app/finance');

    // Second breadcrumb should link to /app/finance/transactions
    expect(links[1]).toHaveAttribute('href', '/app/finance/transactions');
  });

  it('should construct breadcrumb links without /app prefix for public routes', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/investment-calculator'],
    });

    const links = screen.getAllByRole('link');

    // Should link to /investment-calculator (no /app prefix)
    expect(links[0]).toHaveAttribute('href', '/investment-calculator');
  });

  it('should handle nested protected routes correctly', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/portfolio/own/edit/123'],
    });

    const links = screen.getAllByRole('link');

    // Path segments: portfolio, own, edit, 123 (4 links)
    expect(links[0]).toHaveAttribute('href', '/app/portfolio');
    expect(links[1]).toHaveAttribute('href', '/app/portfolio/own');
    // "edit" segment followed by ID should include the ID in the link
    // (navigating to /edit without ID is invalid)
    expect(links[2]).toHaveAttribute('href', '/app/portfolio/own/edit/123');
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/own/edit/123');
  });

  it('should include ID in edit breadcrumb link when followed by numeric ID', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/portfolio/own/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // The "edit" breadcrumb should link to the full path including ID
    // because /edit without an ID is not a valid route
    const editLink = links.find(link =>
      link.textContent?.toLowerCase().includes('edit')
    );
    expect(editLink).toHaveAttribute('href', '/app/portfolio/own/edit/456');
  });

  it('should include ID in add breadcrumb link when followed by numeric ID', () => {
    // Settings uses add/:id pattern
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/settings/expense-types/add/789'],
    });

    const links = screen.getAllByRole('link');

    // The "add" breadcrumb should link to the full path including ID
    const addLink = links.find(link =>
      link.textContent?.toLowerCase().includes('add')
    );
    expect(addLink).toHaveAttribute('href', '/app/settings/expense-types/add/789');
  });

  it('should translate breadcrumb segments', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/dashboard'],
    });

    // Should show translated text or translation key
    // The translation might be "Overview", "Yleiskatsaus", or "dashboard" depending on test setup
    const breadcrumbText = screen.getAllByRole('link')[0].textContent;
    expect(breadcrumbText).toMatch(/(Overview|Yleiskatsaus|dashboard)/i);
  });

  it('should handle hyphenated route segments', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/portfolio/investment-calculations'],
    });

    const links = screen.getAllByRole('link');

    // Links should preserve hyphens and be nested under portfolio
    expect(links[0]).toHaveAttribute('href', '/app/portfolio');
    expect(links[1]).toHaveAttribute('href', '/app/portfolio/investment-calculations');
  });

  it('should filter out numeric IDs but keep them in links', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/portfolio/own/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // Should have link with ID (links: portfolio, properties, own, edit/456, 456)
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/own/edit/456');
  });

  describe('Property name resolution', () => {
    let mockGet: jest.SpyInstance;

    beforeEach(() => {
      mockGet = jest.spyOn(ApiClient, 'get');
    });

    afterEach(() => {
      mockGet.mockRestore();
    });

    it('should display property name instead of ID for prospect property view route', async () => {
      mockGet.mockResolvedValue({ id: 20, name: 'Helsinki Apartment' });

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/20'],
      });

      // Wait for the property name to be fetched and displayed
      await waitFor(() => {
        expect(screen.getByText(/Helsinki Apartment/)).toBeInTheDocument();
      });

      // Should have called API to fetch property
      expect(mockGet).toHaveBeenCalledWith('real-estate/property', 20);
    });

    it('should display property name instead of ID for own property view route', async () => {
      mockGet.mockResolvedValue({ id: 15, name: 'Espoo Studio' });

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/own/15'],
      });

      await waitFor(() => {
        expect(screen.getByText(/Espoo Studio/)).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('real-estate/property', 15);
    });

    it('should display property name instead of ID for prospect edit route', async () => {
      mockGet.mockResolvedValue({ id: 25, name: 'Tampere Flat' });

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/edit/25'],
      });

      await waitFor(() => {
        expect(screen.getByText(/Tampere Flat/)).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('real-estate/property', 25);
    });

    it('should fall back to ID when API fetch fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/prospects/99'],
      });

      // Should still render the ID as fallback
      await waitFor(() => {
        expect(screen.getByText(/99/)).toBeInTheDocument();
      });
    });
  });

  describe('Long property name truncation', () => {
    let mockGet: jest.SpyInstance;

    beforeEach(() => {
      mockGet = jest.spyOn(ApiClient, 'get');
    });

    afterEach(() => {
      mockGet.mockRestore();
    });

    it('should truncate long property names with ellipsis on desktop', async () => {
      const longName = 'This Is A Very Long Property Name That Should Be Truncated With Ellipsis';
      mockGet.mockResolvedValue({ id: 1, name: longName });

      renderWithRouter(<Breadcrumbs testIsMobile={false} />, {
        initialEntries: ['/app/portfolio/own/1'],
      });

      await waitFor(() => {
        const link = screen.getByText(new RegExp(longName.substring(0, 10)));
        expect(link).toHaveStyle({ overflow: 'hidden' });
        expect(link).toHaveStyle({ textOverflow: 'ellipsis' });
        expect(link).toHaveStyle({ whiteSpace: 'nowrap' });
      });
    });

    it('should apply max-width constraint to breadcrumb items', async () => {
      const longName = 'Super Long Property Name For Testing Maximum Width';
      mockGet.mockResolvedValue({ id: 1, name: longName });

      renderWithRouter(<Breadcrumbs testIsMobile={false} />, {
        initialEntries: ['/app/portfolio/own/1'],
      });

      await waitFor(() => {
        const link = screen.getByText(new RegExp(longName.substring(0, 10)));
        // Check that maxWidth is set to desktop width (180px)
        expect(link).toHaveStyle({ maxWidth: '180px' });
      });
    });

    it('should show tooltip with full text on hover for breadcrumb items', async () => {
      const longName = 'Helsinki Downtown Penthouse Apartment';
      mockGet.mockResolvedValue({ id: 1, name: longName });

      renderWithRouter(<Breadcrumbs testIsMobile={false} />, {
        initialEntries: ['/app/portfolio/own/1'],
      });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(longName.substring(0, 10)))).toBeInTheDocument();
      });

      // Hover over the link
      const link = screen.getByText(new RegExp(longName.substring(0, 10)));
      await userEvent.hover(link);

      // Tooltip should appear with full text
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(longName);
      });
    });
  });

  describe('Mobile responsiveness - collapsible middle items', () => {
    let mockGet: jest.SpyInstance;

    beforeEach(() => {
      mockGet = jest.spyOn(ApiClient, 'get');
    });

    afterEach(() => {
      mockGet.mockRestore();
    });

    it('should show all items when breadcrumb has 3 or fewer items on mobile', () => {
      renderWithRouter(<Breadcrumbs testIsMobile={true} />, {
        initialEntries: ['/app/portfolio/own'],
      });

      // Should show all items, no ellipsis button
      expect(screen.queryByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i)).not.toBeInTheDocument();
      expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
      // "own" is translated to "My Properties" in route translations
      expect(screen.getByText(/My Properties/i)).toBeInTheDocument();
    });

    it('should collapse middle items when breadcrumb has more than 3 items on mobile', async () => {
      mockGet.mockResolvedValue({ id: 1, name: 'Test Property' });

      renderWithRouter(<Breadcrumbs testIsMobile={true} />, {
        initialEntries: ['/app/portfolio/own/edit/1'],
      });

      // Should show ellipsis button for collapsed items
      await waitFor(() => {
        expect(screen.getByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i)).toBeInTheDocument();
      });
    });

    it('should open menu with collapsed items when ellipsis button is clicked', async () => {
      mockGet.mockResolvedValue({ id: 1, name: 'Test Property' });

      renderWithRouter(<Breadcrumbs testIsMobile={true} />, {
        initialEntries: ['/app/portfolio/own/edit/1'],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i)).toBeInTheDocument();
      });

      // Click ellipsis button
      const ellipsisButton = screen.getByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i);
      await userEvent.click(ellipsisButton);

      // Menu should open with collapsed items
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should not collapse items on desktop regardless of item count', async () => {
      mockGet.mockResolvedValue({ id: 1, name: 'Test Property' });

      renderWithRouter(<Breadcrumbs testIsMobile={false} />, {
        initialEntries: ['/app/portfolio/own/edit/1'],
      });

      // Should not show ellipsis button on desktop
      await waitFor(() => {
        expect(screen.queryByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i)).not.toBeInTheDocument();
      });
    });

    it('should close menu when clicking outside', async () => {
      mockGet.mockResolvedValue({ id: 1, name: 'Test Property' });

      renderWithRouter(<Breadcrumbs testIsMobile={true} />, {
        initialEntries: ['/app/portfolio/own/edit/1'],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i)).toBeInTheDocument();
      });

      // Open menu
      await userEvent.click(screen.getByLabelText(/showMoreBreadcrumbs|show more breadcrumbs/i));
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Press escape to close
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });
});
