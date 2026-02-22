// frontend/src/components/accounting/expenses/ExpenseForm.fieldErrors.test.tsx
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createAxiosError } from '@test-utils/test-data';
import ExpenseForm from './ExpenseForm';
import DataService from '@alisa-lib/data-service';
import { ExpenseType } from '@alisa-types';

jest.mock('@alisa-lib/data-service');

describe('ExpenseForm field error handling', () => {
  const defaultProps = {
    propertyId: 1,
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  const mockExpenseTypes: ExpenseType[] = [
    { id: 1, key: 'maintenance-charge', isTaxDeductible: true, isCapitalImprovement: false },
    { id: 2, key: 'electricity', isTaxDeductible: true, isCapitalImprovement: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService.search for expense types
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockExpenseTypes);
    jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
      (data, name, value) => ({ ...data, [name]: value })
    );
    // Mock save to simulate server validation error
    jest.spyOn(DataService.prototype, 'save').mockImplementation(() => {
      // Default: success
      return Promise.resolve({ id: 1 });
    });
  });

  describe('frontend validation errors', () => {
    it('shows error on description field when empty and form is submitted', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      // Submit form without filling description (it's empty by default)
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Description field should show error state
      await waitFor(() => {
        const descriptionField = screen.getByLabelText('description');
        expect(descriptionField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on quantity field when less than minimum', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('quantity')).toBeInTheDocument();
      });

      // Set quantity to 0 (minimum is 1)
      const quantityField = screen.getByLabelText('quantity');
      await user.clear(quantityField);
      await user.type(quantityField, '0');

      // Also fill description to avoid that error
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Quantity field should show error state
      await waitFor(() => {
        expect(quantityField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on totalAmount field when less than minimum', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });

      // Fill description to avoid that error
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      // totalAmount starts at 0, which is less than minimum (0.01)
      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // totalAmount field should show error state
      await waitFor(() => {
        const totalAmountField = screen.getByLabelText('totalAmount');
        expect(totalAmountField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on expenseTypeId field when not selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('expenseType')).toBeInTheDocument();
      });

      // Fill other required fields
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // expenseTypeId is not selected (undefined by default)
      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Expense type field should show frontend validation error
      await waitFor(() => {
        const expenseTypeField = screen.getByLabelText('expenseType');
        expect(expenseTypeField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on accountingDate field when date is invalid', async () => {
      const user = userEvent.setup();

      // Mock updateNestedData to allow setting an invalid date
      jest.spyOn(DataService.prototype, 'updateNestedData').mockImplementation(
        (data, name, value) => {
          if (name === 'accountingDate') {
            // Simulate an invalid date (e.g., when user enters 00/00/0000)
            return { ...data, [name]: new Date('Invalid Date') };
          }
          return { ...data, [name]: value };
        }
      );

      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      // Fill all required fields
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select expense type
      const expenseTypeSelect = screen.getByLabelText('expenseType');
      await user.click(expenseTypeSelect);
      const option = await screen.findByRole('option', { name: 'Maintenance charge' });
      await user.click(option);

      // Trigger a change on the date field to set invalid date via our mock
      const dateGroup = screen.getByRole('group', { name: /accountingDate/i });
      const daySection = dateGroup.querySelector('[aria-label="Day"]');
      if (daySection) {
        await user.click(daySection);
        await user.keyboard('00');
      }

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Date picker should show error state
      await waitFor(() => {
        const dateGroupEl = screen.getByRole('group', { name: /accountingDate/i });
        expect(dateGroupEl).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('server-side validation errors', () => {
    it('shows error on amount field when server returns validation error', async () => {
      const user = userEvent.setup();

      // Mock server error for amount field
      jest.spyOn(DataService.prototype, 'save').mockRejectedValue(
        createAxiosError(400, ['amount must be a positive number'])
      );

      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('amount')).toBeInTheDocument();
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select expense type (now required)
      const expenseTypeSelect = screen.getByLabelText('expenseType');
      await user.click(expenseTypeSelect);
      const option = await screen.findByRole('option', { name: 'Maintenance charge' });
      await user.click(option);

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Amount field should show error state from server
      await waitFor(() => {
        const amountField = screen.getByLabelText('amount');
        expect(amountField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on accountingDate field when server returns validation error', async () => {
      const user = userEvent.setup();

      // Mock server error for accountingDate field
      jest.spyOn(DataService.prototype, 'save').mockRejectedValue(
        createAxiosError(400, ['accountingDate must be a valid date'])
      );

      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('accountingDate').length).toBeGreaterThan(0);
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select expense type (now required)
      const expenseTypeSelect = screen.getByLabelText('expenseType');
      await user.click(expenseTypeSelect);
      const option = await screen.findByRole('option', { name: 'Maintenance charge' });
      await user.click(option);

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Date picker should show error state
      // The date picker group has aria-invalid attribute
      await waitFor(() => {
        const dateGroup = screen.getByRole('group', { name: /accountingDate/i });
        expect(dateGroup).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows error on expenseTypeId field when server returns validation error', async () => {
      // This test should FAIL initially - expenseTypeId (AlisaSelect) does NOT support error props
      const user = userEvent.setup();

      // Mock server error for expenseTypeId field
      jest.spyOn(DataService.prototype, 'save').mockRejectedValue(
        createAxiosError(400, ['expenseTypeId must be selected'])
      );

      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('expenseType')).toBeInTheDocument();
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test expense');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Expense type field should show error state
      await waitFor(() => {
        const expenseTypeField = screen.getByLabelText('expenseType');
        expect(expenseTypeField).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('renders all form fields', () => {
    it('renders all expected form fields', async () => {
      renderWithProviders(<ExpenseForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
        expect(screen.getByLabelText('quantity')).toBeInTheDocument();
        expect(screen.getByLabelText('amount')).toBeInTheDocument();
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });
    });
  });
});
