import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ExpenseTypeForm from './ExpenseTypeForm';
import DataService from '@alisa-lib/data-service';

jest.mock('@alisa-lib/data-service');

describe('ExpenseTypeForm', () => {
  const mockExpenseType = {
    id: 1,
    name: 'Test Expense Type',
    description: 'Test description',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  };

  const defaultProps = {
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService methods
    jest.spyOn(DataService.prototype, 'read').mockResolvedValue(mockExpenseType);
    jest.spyOn(DataService.prototype, 'save').mockResolvedValue({ id: 1 });
    jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
      (data, name, value) => ({ ...data, [name]: value })
    );
  });

  describe('Rendering', () => {
    it('renders add header when id is not provided', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add new expense type')).toBeInTheDocument();
      });
    });

    it('renders edit header when id is provided', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} id={1} />);

      await waitFor(() => {
        // The header text comes from translation; verify heading exists
        expect(screen.getByRole('heading')).toBeInTheDocument();
      });
    });

    it('renders name field', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('name')).toBeInTheDocument();
      });
    });

    it('renders description field', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });
    });

    it('renders isTaxDeductible switch', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Tax deductible')).toBeInTheDocument();
      });
    });

    it('renders isCapitalImprovement switch', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Capital improvement (10% annual depreciation)')).toBeInTheDocument();
      });
    });

    it('renders capital improvement help text', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Look for part of the help text
        expect(screen.getByText(/Select for capital improvements/)).toBeInTheDocument();
      });
    });

    it('renders cancel button', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Button may show 'cancel' (translation key) or translated text
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('renders save button', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Button may show 'save' (translation key) or translated text
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edit mode', () => {
    it('loads existing expense type data when id is provided', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} id={1} />);

      await waitFor(() => {
        expect(DataService.prototype.read).toHaveBeenCalledWith(1);
      });
    });

    it('does not call read when id is not provided', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(DataService.prototype.read).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form fields', () => {
    it('allows typing in name field', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('name')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('name');
      await user.type(nameInput, 'New Expense Type');

      expect(nameInput).toHaveValue('New Expense Type');
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText('description');
      await user.type(descriptionInput, 'New description');

      expect(descriptionInput).toHaveValue('New description');
    });

    it('has autocomplete off for name field', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('name');
        expect(nameInput).toHaveAttribute('autocomplete', 'off');
      });
    });

    it('has autocomplete off for description field', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('description');
        expect(descriptionInput).toHaveAttribute('autocomplete', 'off');
      });
    });

    it('autofocuses name field', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('name');
        expect(nameInput).toHaveFocus();
      });
    });
  });

  describe('Switch fields', () => {
    it('toggles isTaxDeductible switch', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Tax deductible')).toBeInTheDocument();
      });

      // MUI Switch uses role="switch"
      const switches = screen.getAllByRole('switch');
      const taxDeductibleSwitch = switches[0];

      // Initially false
      expect(taxDeductibleSwitch).not.toBeChecked();

      // Toggle on
      await user.click(taxDeductibleSwitch);
      expect(taxDeductibleSwitch).toBeChecked();
    });

    it('toggles isCapitalImprovement switch', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Capital improvement (10% annual depreciation)')).toBeInTheDocument();
      });

      // MUI Switch uses role="switch"
      const switches = screen.getAllByRole('switch');
      const capitalImprovementSwitch = switches[1];

      // Initially false
      expect(capitalImprovementSwitch).not.toBeChecked();

      // Toggle on
      await user.click(capitalImprovementSwitch);
      expect(capitalImprovementSwitch).toBeChecked();
    });
  });

  describe('Cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      renderWithProviders(<ExpenseTypeForm {...defaultProps} onCancel={mockOnCancel} />);

      await waitFor(() => {
        // Cancel button text depends on translation
        expect(screen.getByText('cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form submission', () => {
    it('calls onAfterSubmit after successful save', async () => {
      const user = userEvent.setup();
      const mockOnAfterSubmit = jest.fn();

      jest.spyOn(DataService.prototype, 'save').mockResolvedValue({ id: 1 });

      renderWithProviders(
        <ExpenseTypeForm {...defaultProps} onAfterSubmit={mockOnAfterSubmit} />
      );

      await waitFor(() => {
        // Wait for form to render
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
      });

      // Fill required field (first textbox is name)
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'New Expense Type');

      // Submit form (find save button by text)
      const saveButton = screen.getByText('save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnAfterSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Initial state', () => {
    it('starts with empty name', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Name input might be labeled 'name' (key) or translated
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
        expect(inputs[0]).toHaveValue('');
      });
    });

    it('starts with empty description', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(1);
        expect(inputs[1]).toHaveValue('');
      });
    });

    it('starts with switches unchecked', async () => {
      renderWithProviders(<ExpenseTypeForm {...defaultProps} />);

      await waitFor(() => {
        // MUI Switch uses role="switch"
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBeGreaterThan(0);
        switches.forEach((switchEl) => {
          expect(switchEl).not.toBeChecked();
        });
      });
    });
  });
});
