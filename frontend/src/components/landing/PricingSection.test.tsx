import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import PricingSection from './PricingSection';
import ApiClient from '@asset-lib/api-client';

jest.mock('@asset-lib/api-client');

const mockTiers = [
  { id: 1, name: 'Free', price: 0, maxProperties: 1, sortOrder: 1, isDefault: true },
  { id: 2, name: 'Pro', price: 9.99, maxProperties: 10, sortOrder: 2, isDefault: false },
  { id: 3, name: 'Business', price: 29.99, maxProperties: 0, sortOrder: 3, isDefault: false },
];

describe('PricingSection', () => {
  beforeEach(() => {
    jest.spyOn(ApiClient, 'fetchPublic').mockResolvedValue(mockTiers);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    jest.spyOn(ApiClient, 'fetchPublic').mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders tier cards after loading', async () => {
    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    // Wait for Pro tier (unique name) to confirm loading is complete
    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    expect(screen.getByText('Business')).toBeInTheDocument();
    // Free appears multiple times (tier name + price), so check it exists
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0);
  });

  it('displays free tier with special badge', async () => {
    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    // Free tier should have "Start for free" badge and button
    const startFreeElements = screen.getAllByText(/start for free/i);
    expect(startFreeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays pricing information', async () => {
    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    // Pro tier shows price (use exact match to avoid matching 29.99)
    expect(screen.getByText(/^9\.99/)).toBeInTheDocument();
  });

  it('displays property limits', async () => {
    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    // Property limits are displayed
    expect(screen.getByText(/1 property/i)).toBeInTheDocument();
    expect(screen.getByText(/10 properties/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
  });

  it('calls onLoginClick when CTA button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnLoginClick = jest.fn();

    renderWithProviders(<PricingSection onLoginClick={mockOnLoginClick} />);

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    // Click on one of the CTA buttons
    const ctaButtons = screen.getAllByRole('button');
    await user.click(ctaButtons[0]);

    expect(mockOnLoginClick).toHaveBeenCalled();
  });

  it('renders section with pricing id', async () => {
    const { container } = renderWithProviders(
      <PricingSection onLoginClick={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    const section = container.querySelector('#pricing');
    expect(section).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    jest.spyOn(ApiClient, 'fetchPublic').mockRejectedValue(new Error('API Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<PricingSection onLoginClick={jest.fn()} />);

    // Should not show loading after error
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
