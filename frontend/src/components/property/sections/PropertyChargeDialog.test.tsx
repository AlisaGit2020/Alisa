import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PropertyChargeDialog from './PropertyChargeDialog';
import { ChargeType, PropertyCharge } from '@asset-types';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { VITE_API_URL } from '../../../constants';

const mockCharges: PropertyCharge[] = [
  {
    id: 1,
    propertyId: 1,
    chargeType: ChargeType.MAINTENANCE_FEE,
    typeName: 'maintenance-fee',
    amount: 150,
    startDate: '2025-01-01',
    endDate: null,
  },
  {
    id: 2,
    propertyId: 1,
    chargeType: ChargeType.FINANCIAL_CHARGE,
    typeName: 'financial-charge',
    amount: 50,
    startDate: '2025-01-01',
    endDate: '2025-06-30',
  },
  {
    id: 3,
    propertyId: 1,
    chargeType: ChargeType.WATER_PREPAYMENT,
    typeName: 'water-prepayment',
    amount: 25,
    startDate: '2025-01-01',
    endDate: null,
  },
];

const server = setupServer(
  http.get(`${VITE_API_URL}/real-estate/property/1/charges`, () => {
    return HttpResponse.json(mockCharges);
  }),
  http.post(`${VITE_API_URL}/real-estate/property/1/charges`, async ({ request }) => {
    const body = await request.json() as Partial<PropertyCharge>;
    return HttpResponse.json({
      id: 4,
      ...body,
      typeName: 'maintenance-fee',
    });
  }),
  http.delete(`${VITE_API_URL}/real-estate/property/1/charges/:chargeId`, () => {
    return HttpResponse.json({ success: true });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PropertyChargeDialog', () => {
  const defaultProps = {
    open: true,
    propertyId: 1,
    onClose: jest.fn(),
    onChargesUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with data table', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check for table headers
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/amount/i)).toBeInTheDocument();
    expect(screen.getByText(/start date/i)).toBeInTheDocument();
    expect(screen.getByText(/end date/i)).toBeInTheDocument();
  });

  it('shows all charge records for property', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays "Valid until further notice" for null endDate', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      const validUntilTexts = screen.getAllByText(/valid until further notice/i);
      expect(validUntilTexts.length).toBeGreaterThanOrEqual(2); // maintenance fee and water have null endDate
    });
  });

  it('calls onAdd when add button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    // Should open the add form
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  it('calls onEdit with charge data when edit clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Find and click edit button for first charge
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Should open edit form with charge data
    await waitFor(() => {
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    });
  });

  it('calls onDelete with charge id when delete clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Find and click delete button for first charge
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    });
  });

  it('closes dialog when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state while fetching charges', () => {
    server.use(
      http.get(`${VITE_API_URL}/real-estate/property/1/charges`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockCharges);
      }),
    );

    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    server.use(
      http.get(`${VITE_API_URL}/real-estate/property/1/charges`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});