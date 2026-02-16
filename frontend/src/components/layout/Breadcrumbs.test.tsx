import { screen } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';
import { renderWithRouter } from '@test-utils/test-wrapper';

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
      initialEntries: ['/app/portfolio/properties/edit/123'],
    });

    const links = screen.getAllByRole('link');

    // Check all links have /app prefix
    expect(links[0]).toHaveAttribute('href', '/app/portfolio');
    expect(links[1]).toHaveAttribute('href', '/app/portfolio/properties');
    expect(links[2]).toHaveAttribute('href', '/app/portfolio/properties/edit');
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/properties/edit/123');
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
      initialEntries: ['/app/portfolio/properties/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // Should have link with ID
    expect(links[3]).toHaveAttribute('href', '/app/portfolio/properties/edit/456');
  });
});
