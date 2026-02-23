// frontend/src/components/accounting/incomes/IncomeForm.fieldErrors.test.tsx
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createAxiosError } from '@test-utils/test-data';
import IncomeForm from './IncomeForm';
import DataService from '@asset-lib/data-service';
import { IncomeType } from '@asset-types';

jest.mock('@asset-lib/data-service');

describe('IncomeForm field error handling', () => {
  const defaultProps = {
    propertyId: 1,
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  const mockIncomeTypes: IncomeType[] = [
    { id: 1, key: 'rental', isTaxable: true },
    { id: 2, key: 'airbnb', isTaxable: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DataService.search for income types
    jest.spyOn(DataService.prototype, 'search').mockResolvedValue(mockIncomeTypes);
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
      renderWithProviders(<IncomeForm {...defaultProps} />);

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
      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('quantity')).toBeInTheDocument();
      });

      // Set quantity to 0 (minimum is 1)
      const quantityField = screen.getByLabelText('quantity');
      await user.clear(quantityField);
      await user.type(quantityField, '0');

      // Also fill description to avoid that error
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

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
      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });

      // Fill description to avoid that error
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

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

    it('shows error on incomeTypeId field when not selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('incomeType')).toBeInTheDocument();
      });

      // Fill other required fields
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // incomeTypeId is not selected (undefined by default)
      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Income type field should show frontend validation error
      await waitFor(() => {
        const incomeTypeField = screen.getByLabelText('incomeType');
        expect(incomeTypeField).toHaveAttribute('aria-invalid', 'true');
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

      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
      });

      // Fill all required fields
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select income type
      const incomeTypeSelect = screen.getByLabelText('incomeType');
      await user.click(incomeTypeSelect);
      const option = await screen.findByRole('option', { name: 'Rental income' });
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

      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('amount')).toBeInTheDocument();
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select income type (now required)
      const incomeTypeSelect = screen.getByLabelText('incomeType');
      await user.click(incomeTypeSelect);
      const option = await screen.findByRole('option', { name: 'Rental income' });
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

      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('accountingDate').length).toBeGreaterThan(0);
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Select income type (now required)
      const incomeTypeSelect = screen.getByLabelText('incomeType');
      await user.click(incomeTypeSelect);
      const option = await screen.findByRole('option', { name: 'Rental income' });
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

    it('shows error on incomeTypeId field when server returns validation error', async () => {
      // This test should FAIL initially - incomeTypeId (AssetSelect) does NOT support error props
      const user = userEvent.setup();

      // Mock server error for incomeTypeId field
      jest.spyOn(DataService.prototype, 'save').mockRejectedValue(
        createAxiosError(400, ['incomeTypeId must be selected'])
      );

      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('incomeType')).toBeInTheDocument();
      });

      // Fill required fields to pass frontend validation
      const descriptionField = screen.getByLabelText('description');
      await user.type(descriptionField, 'Test income');

      const totalAmountField = screen.getByLabelText('totalAmount');
      await user.clear(totalAmountField);
      await user.type(totalAmountField, '100');

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'save' });
      await user.click(saveButton);

      // Income type field should show error state
      await waitFor(() => {
        const incomeTypeField = screen.getByLabelText('incomeType');
        expect(incomeTypeField).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('renders all form fields', () => {
    it('renders all expected form fields', async () => {
      renderWithProviders(<IncomeForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('description')).toBeInTheDocument();
        expect(screen.getByLabelText('quantity')).toBeInTheDocument();
        expect(screen.getByLabelText('amount')).toBeInTheDocument();
        expect(screen.getByLabelText('totalAmount')).toBeInTheDocument();
      });
    });
  });
});
