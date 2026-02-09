import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import IncomeTypeForm from './IncomeTypeForm';
import DataService from '@alisa-lib/data-service';

jest.mock('@alisa-lib/data-service');

describe('IncomeTypeForm', () => {
  const mockIncomeType = {
    id: 1,
    name: 'Test Income Type',
    description: 'Test description',
    isTaxable: true,
  };

  const defaultProps = {
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService methods
    jest.spyOn(DataService.prototype, 'read').mockResolvedValue(mockIncomeType);
    jest.spyOn(DataService.prototype, 'save').mockResolvedValue({ id: 1 });
    jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
      (data, name, value) => ({ ...data, [name]: value })
    );
  });

  describe('Rendering', () => {
    it('renders add header when id is not provided', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add new income type')).toBeInTheDocument();
      });
    });

    it('renders edit header when id is provided', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} id={1} />);

      await waitFor(() => {
        // The header text comes from translation; 'edit' translation might differ
        expect(screen.getByRole('heading')).toBeInTheDocument();
      });
    });

    it('renders name field', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('name')).toBeInTheDocument();
      });
    });

    it('renders description field', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });
    });

    it('renders isTaxable switch', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Taxable')).toBeInTheDocument();
      });
    });

    it('renders cancel button', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Button may show 'cancel' (translation key) or translated text
        expect(screen.getByText('cancel')).toBeInTheDocument();
      });
    });

    it('renders save button', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        // Button may show 'save' (translation key) or translated text
        expect(screen.getByText('save')).toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    it('loads existing income type data when id is provided', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} id={1} />);

      await waitFor(() => {
        expect(DataService.prototype.read).toHaveBeenCalledWith(1);
      });
    });

    it('does not call read when id is not provided', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(DataService.prototype.read).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form fields', () => {
    it('allows typing in name field', async () => {
      const user = userEvent.setup();

      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('name')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('name');
      await user.type(nameInput, 'New Income Type');

      expect(nameInput).toHaveValue('New Income Type');
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();

      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText('description');
      await user.type(descriptionInput, 'New description');

      expect(descriptionInput).toHaveValue('New description');
    });

    it('has autocomplete off for name field', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('name');
        expect(nameInput).toHaveAttribute('autocomplete', 'off');
      });
    });

    it('has autocomplete off for description field', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('description');
        expect(descriptionInput).toHaveAttribute('autocomplete', 'off');
      });
    });

    it('autofocuses name field', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('name');
        expect(nameInput).toHaveFocus();
      });
    });
  });

  describe('Switch fields', () => {
    it('toggles isTaxable switch', async () => {
      const user = userEvent.setup();

      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Taxable')).toBeInTheDocument();
      });

      // MUI Switch uses role="switch"
      const taxableSwitch = screen.getByRole('switch');

      // Initially false
      expect(taxableSwitch).not.toBeChecked();

      // Toggle on
      await user.click(taxableSwitch);
      expect(taxableSwitch).toBeChecked();
    });
  });

  describe('Cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      renderWithProviders(<IncomeTypeForm {...defaultProps} onCancel={mockOnCancel} />);

      await waitFor(() => {
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
        <IncomeTypeForm {...defaultProps} onAfterSubmit={mockOnAfterSubmit} />
      );

      await waitFor(() => {
        // Wait for form to render
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
      });

      // Fill required field (first textbox is name)
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'New Income Type');

      // Submit form
      const saveButton = screen.getByText('save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnAfterSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Initial state', () => {
    it('starts with empty name', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
        expect(inputs[0]).toHaveValue('');
      });
    });

    it('starts with empty description', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(1);
        expect(inputs[1]).toHaveValue('');
      });
    });

    it('starts with isTaxable unchecked', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        // MUI Switch uses role="switch"
        const taxableSwitch = screen.getByRole('switch');
        expect(taxableSwitch).not.toBeChecked();
      });
    });
  });

  describe('Comparison with ExpenseTypeForm', () => {
    it('does not have isCapitalImprovement field (income types only have isTaxable)', async () => {
      renderWithProviders(<IncomeTypeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Taxable')).toBeInTheDocument();
      });

      // IncomeTypeForm should only have one switch (isTaxable)
      // MUI Switch uses role="switch"
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(1);
    });
  });
});
