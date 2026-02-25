import { screen, waitFor } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';
import { renderWithRouter } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';

describe('Breadcrumbs', () => {
  it('should not display "app" in breadcrumb text for protected routes', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/dashboard'],
    });

    // Should show "Dashboard" but not "app"
    expect(screen.queryByText(/app/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
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
      initialEntries: ['/app/portfolio/properties/own/edit/123'],
    });

    const links = screen.getAllByRole('link');

    // Check all links have /app prefix
    expect(links[0]).toHaveAttribute('href', '/app/portfolio');
    expect(links[1]).toHaveAttribute('href', '/app/portfolio/properties');
    expect(links[2]).toHaveAttribute('href', '/app/portfolio/properties/own');
    // "edit" segment followed by ID should include the ID in the link
    // (navigating to /edit without ID is invalid)
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/properties/own/edit/123');
    expect(links[4]).toHaveAttribute('href', '/app/portfolio/properties/own/edit/123');
  });

  it('should include ID in edit breadcrumb link when followed by numeric ID', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/portfolio/properties/own/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // The "edit" breadcrumb should link to the full path including ID
    // because /edit without an ID is not a valid route
    const editLink = links.find(link =>
      link.textContent?.toLowerCase().includes('edit')
    );
    expect(editLink).toHaveAttribute('href', '/app/portfolio/properties/own/edit/456');
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
      initialEntries: ['/app/portfolio/properties/own/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // Should have link with ID (links: portfolio, properties, own, edit/456, 456)
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/properties/own/edit/456');
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
        initialEntries: ['/app/portfolio/properties/prospects/20'],
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
        initialEntries: ['/app/portfolio/properties/own/15'],
      });

      await waitFor(() => {
        expect(screen.getByText(/Espoo Studio/)).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('real-estate/property', 15);
    });

    it('should display property name instead of ID for prospect edit route', async () => {
      mockGet.mockResolvedValue({ id: 25, name: 'Tampere Flat' });

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/properties/prospects/edit/25'],
      });

      await waitFor(() => {
        expect(screen.getByText(/Tampere Flat/)).toBeInTheDocument();
      });

      expect(mockGet).toHaveBeenCalledWith('real-estate/property', 25);
    });

    it('should fall back to ID when API fetch fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Breadcrumbs />, {
        initialEntries: ['/app/portfolio/properties/prospects/99'],
      });

      // Should still render the ID as fallback
      await waitFor(() => {
        expect(screen.getByText(/99/)).toBeInTheDocument();
      });
    });
  });
});
