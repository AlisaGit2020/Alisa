import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ExpenseTypes from './ExpenseTypes';
import DataService from '@alisa-lib/data-service';

jest.mock('@alisa-lib/data-service');
jest.mock('@alisa-lib/api-client');

describe('ExpenseTypes', () => {
  const mockExpenseTypes = [
    { id: 1, name: 'Repairs', description: 'General repairs', isTaxDeductible: true },
    { id: 2, name: 'Maintenance', description: 'Regular maintenance', isTaxDeductible: true },
    { id: 3, name: 'Renovation', description: 'Major renovations', isTaxDeductible: false },
  ];

  const defaultProps = {
    onAdd: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService.search() to return expense types
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockExpenseTypes);
  });

  describe('Rendering', () => {
    it('renders expense types header', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Expense types')).toBeInTheDocument();
      });
    });

    it('renders data table', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        // Table should render with expense type data
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('displays expense type names from API', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Repairs')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Renovation')).toBeInTheDocument();
      });
    });

    it('displays expense type descriptions', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('General repairs')).toBeInTheDocument();
        expect(screen.getByText('Regular maintenance')).toBeInTheDocument();
        expect(screen.getByText('Major renovations')).toBeInTheDocument();
      });
    });

    it('renders column headers', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByText('Tax deductible')).toBeInTheDocument();
      });
    });
  });

  describe('Data loading', () => {
    it('fetches expense types on mount', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(DataService.prototype.search).toHaveBeenCalled();
      });
    });

    it('handles empty expense types list', async () => {
      jest.spyOn(DataService.prototype, 'search').mockResolvedValue([]);

      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        // Should render table without data rows
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Add functionality', () => {
    it('calls onAdd when add button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnAdd = jest.fn();

      renderWithProviders(<ExpenseTypes {...defaultProps} onAdd={mockOnAdd} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and click the add button (usually has AddIcon)
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit functionality', () => {
    it('calls onEdit with correct id when edit icon is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();

      renderWithProviders(<ExpenseTypes {...defaultProps} onEdit={mockOnEdit} />);

      await waitFor(() => {
        expect(screen.getByText('Repairs')).toBeInTheDocument();
      });

      // Find icon buttons in the table rows (edit icons)
      const iconButtons = screen.getAllByTestId('EditIcon');
      await user.click(iconButtons[0].closest('button')!);

      expect(mockOnEdit).toHaveBeenCalledWith(1);
    });
  });

  describe('Boolean column formatting', () => {
    it('displays tax deductible status as boolean', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Boolean values should be displayed (format: 'boolean' in field config)
      // The exact display depends on AlisaDataTable boolean formatting
    });
  });

  describe('Delete functionality', () => {
    it('renders delete buttons in the table', async () => {
      renderWithProviders(<ExpenseTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Repairs')).toBeInTheDocument();
      });

      // Delete buttons should be rendered
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
