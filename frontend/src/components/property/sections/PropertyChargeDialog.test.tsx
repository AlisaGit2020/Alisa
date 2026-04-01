import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, server } from '@test-utils/index';
import Cookies from 'js-cookie';
import PropertyChargeDialog from './PropertyChargeDialog';
import { ChargeType, PropertyCharge } from '@asset-types';

const API_BASE = 'http://localhost:3000';

const mockCharges: PropertyCharge[] = [
  {
    id: 1,
    propertyId: 1,
    chargeType: ChargeType.MAINTENANCE_FEE,
    typeName: 'maintenance-fee',
    amount: 100,
    startDate: '2024-01-01',
    endDate: null, // Current season
  },
  {
    id: 2,
    propertyId: 1,
    chargeType: ChargeType.FINANCIAL_CHARGE,
    typeName: 'financial-charge',
    amount: 20,
    startDate: '2024-01-01',
    endDate: null, // Current season
  },
];

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
};

describe('PropertyChargeDialog', () => {
  const defaultProps = {
    open: true,
    propertyId: 1,
    onClose: jest.fn(),
    onChargesUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock auth cookie for ApiClient.getToken()
    Cookies.set('_auth', 'mock-test-token');

    // Mock the user endpoint (called by UserProvider)
    server.use(
      http.get(`${API_BASE}/api/auth/user`, () => {
        return HttpResponse.json(mockUser);
      }),
      http.get(`${API_BASE}/api/real-estate/property/:propertyId/charges`, () => {
        return HttpResponse.json(mockCharges);
      })
    );
  });

  afterEach(() => {
    Cookies.remove('_auth');
  });

  it('renders dialog with season view', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check for dialog title
    expect(screen.getByText('Charges')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify "Add New Season" button is present (this confirms the season-based UI is rendered)
    expect(screen.getByRole('button', { name: /add new season/i })).toBeInTheDocument();
  });

  it('shows add new season button', async () => {
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /add new season/i })).toBeInTheDocument();
  });

  it('opens form when add new season clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyChargeDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add new season/i });
    await user.click(addButton);

    // Form should be visible
    await waitFor(() => {
      expect(screen.getAllByText('Start Date').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('End Date').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
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
});
