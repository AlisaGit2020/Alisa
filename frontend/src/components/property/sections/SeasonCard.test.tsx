import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SeasonCard from './SeasonCard';
import { ChargeType, PropertyCharge } from '@asset-types';

describe('SeasonCard', () => {
  // Total is calculated from component charges
  const mockCharges: PropertyCharge[] = [
    { id: 1, propertyId: 1, chargeType: ChargeType.MAINTENANCE_FEE, typeName: 'maintenance-fee', amount: 150, startDate: '2024-04-01', endDate: null },
    { id: 2, propertyId: 1, chargeType: ChargeType.FINANCIAL_CHARGE, typeName: 'financial-charge', amount: 85, startDate: '2024-04-01', endDate: null },
    { id: 3, propertyId: 1, chargeType: ChargeType.WATER_PREPAYMENT, typeName: 'water-prepayment', amount: 25, startDate: '2024-04-01', endDate: null },
    { id: 4, propertyId: 1, chargeType: ChargeType.OTHER_CHARGE_BASED, typeName: 'other-charge-based', amount: 15, startDate: '2024-04-01', endDate: null },
  ];

  it('renders all charge amounts', () => {
    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2024-04-01"
        endDate={null}
        isActive={true}
        onEdit={jest.fn()}
      />
    );

    // Finnish currency format: "150,00 €" (with non-breaking space before €)
    expect(screen.getByText(/150,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/85,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/25,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/15,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/275,00\s*€/)).toBeInTheDocument();
  });

  it('shows edit button for active season', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2024-04-01"
        endDate={null}
        isActive={true}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('shows edit button for inactive season', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2023-01-01"
        endDate="2024-03-31"
        isActive={false}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('shows delete button and calls onDelete', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SeasonCard
        charges={mockCharges}
        startDate="2024-04-01"
        endDate={null}
        isActive={true}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });
});
