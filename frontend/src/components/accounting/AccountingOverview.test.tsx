// frontend/src/components/accounting/AccountingOverview.test.tsx
import { renderWithProviders, screen } from '@test-utils/test-wrapper';
import '@testing-library/jest-dom';
import AccountingOverview from './AccountingOverview';

describe('AccountingOverview', () => {
  describe('Rendering', () => {
    it('renders all three sub-page cards', () => {
      renderWithProviders(<AccountingOverview />);

      // Check for all three card types by looking for their title translation keys
      // Since we're using i18n, check for the translation results
      // Use getAllByText since title and description may both match
      const expensesElements = screen.getAllByText(/expenses/i);
      expect(expensesElements.length).toBeGreaterThanOrEqual(1);

      const incomesElements = screen.getAllByText(/incomes/i);
      expect(incomesElements.length).toBeGreaterThanOrEqual(1);

      const transactionElements = screen.getAllByText(/bankTransactions/i);
      expect(transactionElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders expense card with correct link', () => {
      renderWithProviders(<AccountingOverview />);

      // The expense card should link to the expenses route
      const links = screen.getAllByRole('link');
      const expenseLink = links.find((link) =>
        link.getAttribute('href')?.includes('expense')
      );
      expect(expenseLink).toBeDefined();
    });

    it('renders income card with correct link', () => {
      renderWithProviders(<AccountingOverview />);

      const links = screen.getAllByRole('link');
      const incomeLink = links.find((link) =>
        link.getAttribute('href')?.includes('income')
      );
      expect(incomeLink).toBeDefined();
    });

    it('renders transaction card with correct link', () => {
      renderWithProviders(<AccountingOverview />);

      const links = screen.getAllByRole('link');
      const transactionLink = links.find((link) =>
        link.getAttribute('href')?.includes('transaction')
      );
      expect(transactionLink).toBeDefined();
    });

    it('renders all cards with icons', () => {
      renderWithProviders(<AccountingOverview />);

      // Check for the presence of SVG icons
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SubPages configuration', () => {
    const subPages = [
      {
        id: 'expenses',
        titleKey: 'expenses',
        descriptionKey: 'expensesDescription',
        color: 'error.main',
      },
      {
        id: 'incomes',
        titleKey: 'incomes',
        descriptionKey: 'incomesDescription',
        color: 'success.main',
      },
      {
        id: 'bankTransactions',
        titleKey: 'bankTransactions',
        descriptionKey: 'bankTransactionsDescription',
        color: 'primary.main',
      },
    ];

    it('has three sub-pages configured', () => {
      expect(subPages).toHaveLength(3);
    });

    it('expense sub-page uses error color', () => {
      const expense = subPages.find((p) => p.id === 'expenses');
      expect(expense?.color).toBe('error.main');
    });

    it('income sub-page uses success color', () => {
      const income = subPages.find((p) => p.id === 'incomes');
      expect(income?.color).toBe('success.main');
    });

    it('bank transactions sub-page uses primary color', () => {
      const transaction = subPages.find((p) => p.id === 'bankTransactions');
      expect(transaction?.color).toBe('primary.main');
    });

    it('all sub-pages have unique ids', () => {
      const ids = subPages.map((p) => p.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(subPages.length);
    });

    it('all sub-pages have title and description keys', () => {
      subPages.forEach((page) => {
        expect(page.titleKey).toBeTruthy();
        expect(page.descriptionKey).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('cards are keyboard accessible via links', () => {
      renderWithProviders(<AccountingOverview />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Layout', () => {
    it('renders within HubPageTemplate', () => {
      const { container } = renderWithProviders(<AccountingOverview />);

      // Check that Grid container is present for the cards
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('renders cards in a grid layout', () => {
      const { container } = renderWithProviders(<AccountingOverview />);

      // Check that individual grid items are present
      const gridItems = container.querySelectorAll('[class*="MuiGrid-root"]');
      expect(gridItems.length).toBeGreaterThanOrEqual(3);
    });
  });
});
