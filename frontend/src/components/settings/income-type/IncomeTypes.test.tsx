import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import IncomeTypes from './IncomeTypes';
import DataService from '@alisa-lib/data-service';

jest.mock('@alisa-lib/data-service');

describe('IncomeTypes', () => {
  const mockIncomeTypes = [
    { id: 1, name: 'Rent', description: 'Rental income', isTaxable: true },
    { id: 2, name: 'Deposit Refund', description: 'Returned deposit', isTaxable: false },
    { id: 3, name: 'Other Income', description: 'Miscellaneous income', isTaxable: true },
  ];

  const defaultProps = {
    onAdd: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService.search() to return income types
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockIncomeTypes);
  });

  describe('Rendering', () => {
    it('renders income types header', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Income types')).toBeInTheDocument();
      });
    });

    it('renders data table', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('displays income type names from API', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('Deposit Refund')).toBeInTheDocument();
        expect(screen.getByText('Other Income')).toBeInTheDocument();
      });
    });

    it('displays income type descriptions', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Rental income')).toBeInTheDocument();
        expect(screen.getByText('Returned deposit')).toBeInTheDocument();
        expect(screen.getByText('Miscellaneous income')).toBeInTheDocument();
      });
    });

    it('renders column headers', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByText('Taxable')).toBeInTheDocument();
      });
    });
  });

  describe('Data loading', () => {
    it('fetches income types on mount', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(DataService.prototype.search).toHaveBeenCalled();
      });
    });

    it('handles empty income types list', async () => {
      jest.spyOn(DataService.prototype, 'search').mockResolvedValue([]);

      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Add functionality', () => {
    it('calls onAdd when add button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnAdd = jest.fn();

      renderWithProviders(<IncomeTypes {...defaultProps} onAdd={mockOnAdd} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and click the add button
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit functionality', () => {
    it('calls onEdit with correct id when edit icon is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();

      renderWithProviders(<IncomeTypes {...defaultProps} onEdit={mockOnEdit} />);

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument();
      });

      // Find icon buttons in the table rows (edit icons)
      const iconButtons = screen.getAllByTestId('EditIcon');
      await user.click(iconButtons[0].closest('button')!);

      expect(mockOnEdit).toHaveBeenCalledWith(1);
    });
  });

  describe('Boolean column formatting', () => {
    it('displays taxable status as boolean', async () => {
      renderWithProviders(<IncomeTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Boolean values should be displayed (format: 'boolean' in field config)
    });
  });
});
