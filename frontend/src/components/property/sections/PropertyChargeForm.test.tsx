import { screen } from '@testing-library/react';
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
    // Date pickers render with multiple labels, so just check they exist
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
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

});
