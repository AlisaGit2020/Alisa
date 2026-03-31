import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyChargeForm from './PropertyChargeForm';
import { ChargeType, PropertyCharge } from '@asset-types';

describe('PropertyChargeForm', () => {
  const defaultProps = {
    propertyId: 1,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with all fields', () => {
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    expect(screen.getByLabelText(/charge type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('chargeType select shows all charge types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    const chargeTypeSelect = screen.getByLabelText(/charge type/i);
    await user.click(chargeTypeSelect);

    await waitFor(() => {
      expect(screen.getByText(/hoitovastike/i)).toBeInTheDocument();
      expect(screen.getByText(/rahoitusvastike/i)).toBeInTheDocument();
      expect(screen.getByText(/vesi-ennakko/i)).toBeInTheDocument();
      expect(screen.getByText(/yhtiövastike/i)).toBeInTheDocument();
    });
  });

  it('validates startDate is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    // Fill in other fields but not startDate
    const amountField = screen.getByLabelText(/amount/i);
    await user.clear(amountField);
    await user.type(amountField, '100');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates amount is >= 0', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    const amountField = screen.getByLabelText(/amount/i);
    await user.clear(amountField);
    await user.type(amountField, '-50');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be/i)).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('allows empty endDate (valid until further notice)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    // Select charge type
    const chargeTypeSelect = screen.getByLabelText(/charge type/i);
    await user.click(chargeTypeSelect);
    await user.click(screen.getByText(/hoitovastike/i));

    // Fill in amount
    const amountField = screen.getByLabelText(/amount/i);
    await user.clear(amountField);
    await user.type(amountField, '150');

    // Fill in start date
    const startDateField = screen.getByLabelText(/start date/i);
    await user.clear(startDateField);
    await user.type(startDateField, '01.01.2025');

    // Leave end date empty
    const endDateField = screen.getByLabelText(/end date/i);
    expect(endDateField).toHaveValue('');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: 150,
          endDate: null,
        }),
      );
    });
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    // Select charge type
    const chargeTypeSelect = screen.getByLabelText(/charge type/i);
    await user.click(chargeTypeSelect);
    await user.click(screen.getByText(/rahoitusvastike/i));

    // Fill in amount
    const amountField = screen.getByLabelText(/amount/i);
    await user.clear(amountField);
    await user.type(amountField, '50');

    // Fill in start date
    const startDateField = screen.getByLabelText(/start date/i);
    await user.clear(startDateField);
    await user.type(startDateField, '01.07.2025');

    // Fill in end date
    const endDateField = screen.getByLabelText(/end date/i);
    await user.clear(endDateField);
    await user.type(endDateField, '30.06.2026');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: 1,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: 50,
          startDate: expect.any(String),
          endDate: expect.any(String),
        }),
      );
    });
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('populates fields when editing existing charge', () => {
    const existingCharge: PropertyCharge = {
      id: 1,
      propertyId: 1,
      chargeType: ChargeType.MAINTENANCE_FEE,
      typeName: 'maintenance-fee',
      amount: 150,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    };

    renderWithProviders(
      <PropertyChargeForm {...defaultProps} charge={existingCharge} />,
    );

    expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/01.01.2025/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/31.12.2025/i)).toBeInTheDocument();
  });

  it('shows correct title for add mode', () => {
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    expect(screen.getByText(/add charge/i)).toBeInTheDocument();
  });

  it('shows correct title for edit mode', () => {
    const existingCharge: PropertyCharge = {
      id: 1,
      propertyId: 1,
      chargeType: ChargeType.MAINTENANCE_FEE,
      typeName: 'maintenance-fee',
      amount: 150,
      startDate: '2025-01-01',
      endDate: null,
    };

    renderWithProviders(
      <PropertyChargeForm {...defaultProps} charge={existingCharge} />,
    );

    expect(screen.getByText(/edit charge/i)).toBeInTheDocument();
  });

  it('disables chargeType select when editing', () => {
    const existingCharge: PropertyCharge = {
      id: 1,
      propertyId: 1,
      chargeType: ChargeType.MAINTENANCE_FEE,
      typeName: 'maintenance-fee',
      amount: 150,
      startDate: '2025-01-01',
      endDate: null,
    };

    renderWithProviders(
      <PropertyChargeForm {...defaultProps} charge={existingCharge} />,
    );

    const chargeTypeSelect = screen.getByLabelText(/charge type/i);
    expect(chargeTypeSelect).toBeDisabled();
  });

  it('shows helper text for endDate field', () => {
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    expect(screen.getByText(/leave empty for "valid until further notice"/i)).toBeInTheDocument();
  });
});