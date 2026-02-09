import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import LoanSettings from './LoanSettings';
import ApiClient from '@alisa-lib/api-client';
import DataService from '@alisa-lib/data-service';
import { createMockUser } from '@test-utils/test-data';

jest.mock('@alisa-lib/api-client');
jest.mock('@alisa-lib/data-service');

describe('LoanSettings', () => {
  const mockUser = createMockUser({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    loanPrincipalExpenseTypeId: 1,
    loanInterestExpenseTypeId: 2,
    loanHandlingFeeExpenseTypeId: 3,
  });

  const mockExpenseTypes = [
    { id: 1, name: 'Principal Payment' },
    { id: 2, name: 'Interest Payment' },
    { id: 3, name: 'Handling Fee' },
    { id: 4, name: 'Other Expense' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ApiClient.me() to return user with loan settings
    jest.spyOn(ApiClient, 'me').mockResolvedValue(mockUser);
    jest.spyOn(ApiClient, 'updateUserSettings').mockResolvedValue(mockUser);

    // Mock DataService.search() to return expense types
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockExpenseTypes);
  });

  describe('Rendering', () => {
    it('renders loan settings title after loading', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByText('Loan settings')).toBeInTheDocument();
      });
    });

    it('renders loan settings description', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByText(/Configure default expense types/)).toBeInTheDocument();
      });
    });

    it('renders loan principal select field', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        const elements = screen.getAllByText('Loan principal');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('renders loan interest select field', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        const elements = screen.getAllByText('Loan interest');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('renders loan handling fee select field', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        const elements = screen.getAllByText('Loan handling fee');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('renders save button', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });
    });

    it('renders as Paper container', async () => {
      const { container } = renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('renders nothing while loading', () => {
      // Delay the mock to catch loading state
      jest.spyOn(ApiClient, 'me').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      const { container } = renderWithProviders(<LoanSettings />);

      // Component returns null during loading
      expect(container.firstChild).toBeNull();
    });

    it('fetches user settings on mount', async () => {
      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(ApiClient.me).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Initial values', () => {
    it('loads saved loan principal expense type', async () => {
      renderWithProviders(<LoanSettings />);

      // Wait for the component to load and render select fields
      await waitFor(() => {
        // Multiple elements with same label exist due to MUI structure
        const elements = screen.getAllByText('Loan principal');
        expect(elements.length).toBeGreaterThan(0);
      });

      // Verify ApiClient.me was called to fetch initial settings
      expect(ApiClient.me).toHaveBeenCalled();
    });

    it('handles user with no loan settings', async () => {
      const userWithNoSettings = createMockUser({
        id: 1,
        loanPrincipalExpenseTypeId: undefined,
        loanInterestExpenseTypeId: undefined,
        loanHandlingFeeExpenseTypeId: undefined,
      });

      jest.spyOn(ApiClient, 'me').mockResolvedValue(userWithNoSettings);

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByText('Loan settings')).toBeInTheDocument();
      });

      // Should render without errors
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    });
  });

  describe('Save functionality', () => {
    it('calls updateUserSettings when save is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(ApiClient.updateUserSettings).toHaveBeenCalled();
      });
    });

    it('disables save button while saving', async () => {
      const user = userEvent.setup();

      // Delay the save operation
      jest.spyOn(ApiClient, 'updateUserSettings').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Button should be disabled while saving
      expect(saveButton).toBeDisabled();
    });

    it('re-enables save button after save completes', async () => {
      const user = userEvent.setup();

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('sends undefined for unset expense types (value 0)', async () => {
      const user = userEvent.setup();

      const userWithNoSettings = createMockUser({
        id: 1,
        loanPrincipalExpenseTypeId: undefined,
        loanInterestExpenseTypeId: undefined,
        loanHandlingFeeExpenseTypeId: undefined,
      });

      jest.spyOn(ApiClient, 'me').mockResolvedValue(userWithNoSettings);

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(ApiClient.updateUserSettings).toHaveBeenCalledWith({
          loanPrincipalExpenseTypeId: undefined,
          loanInterestExpenseTypeId: undefined,
          loanHandlingFeeExpenseTypeId: undefined,
        });
      });
    });

    it('sends expense type IDs for set values', async () => {
      const user = userEvent.setup();

      renderWithProviders(<LoanSettings />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(ApiClient.updateUserSettings).toHaveBeenCalledWith({
          loanPrincipalExpenseTypeId: 1,
          loanInterestExpenseTypeId: 2,
          loanHandlingFeeExpenseTypeId: 3,
        });
      });
    });
  });

});
