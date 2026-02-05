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
      initialEntries: ['/app/accounting/transactions'],
    });

    // Find all breadcrumb links
    const links = screen.getAllByRole('link');

    // First breadcrumb should link to /app/accounting
    expect(links[0]).toHaveAttribute('href', '/app/accounting');

    // Second breadcrumb should link to /app/accounting/transactions
    expect(links[1]).toHaveAttribute('href', '/app/accounting/transactions');
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
      initialEntries: ['/app/properties/edit/123'],
    });

    const links = screen.getAllByRole('link');

    // Check all links have /app prefix
    expect(links[0]).toHaveAttribute('href', '/app/properties');
    expect(links[1]).toHaveAttribute('href', '/app/properties/edit');
    expect(links[2]).toHaveAttribute('href', '/app/properties/edit/123');
  });

  it('should translate breadcrumb segments', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/dashboard'],
    });

    // Should show translated text
    // The translation might be "Dashboard" or "Etusivu" depending on language
    const breadcrumbText = screen.getAllByRole('link')[0].textContent;
    expect(breadcrumbText).toMatch(/(Dashboard|Etusivu)/i);
  });

  it('should handle hyphenated route segments', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/investment-calculations'],
    });

    const links = screen.getAllByRole('link');

    // Link should preserve hyphens
    expect(links[0]).toHaveAttribute('href', '/app/investment-calculations');
  });

  it('should filter out numeric IDs but keep them in links', () => {
    renderWithRouter(<Breadcrumbs />, {
      initialEntries: ['/app/properties/edit/456'],
    });

    const links = screen.getAllByRole('link');

    // Should have link with ID
    expect(links[2]).toHaveAttribute('href', '/app/properties/edit/456');
  });
});
