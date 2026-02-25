import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetCardList from './AssetCardList';
import ApiClient from '@asset-lib/api-client';
import { propertyContext } from '@asset-lib/asset-contexts';
import { TFunction } from 'i18next';

// Mock ApiClient static methods
jest.spyOn(ApiClient, 'search');
jest.spyOn(ApiClient, 'delete');
jest.spyOn(ApiClient, 'fetch');

interface TestProperty {
  id: number;
  name: string;
  size: number;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  buildYear: number;
  ownerships: { share: number }[];
}

describe('AssetCardList', () => {
  const mockT = ((key: string) => {
    const translations: Record<string, string> = {
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      confirm: 'Confirm',
      confirmDelete: 'Are you sure you want to delete?',
      noRowsFound: 'No rows found',
      size: 'Size',
      buildYear: 'Build year',
      ownershipShare: 'Ownership share',
      noDescription: 'No description',
    };
    return translations[key] || key;
  }) as TFunction;

  const mockProperties = [
    {
      id: 1,
      name: 'Test Property 1',
      size: 75,
      description: 'A test property',
      address: 'Test Street 1',
      city: 'Helsinki',
      postalCode: '00100',
      buildYear: 2020,
      ownerships: [{ share: 100 }],
    },
    {
      id: 2,
      name: 'Test Property 2',
      size: 100,
      description: 'Another test property',
      address: 'Test Street 2',
      city: 'Espoo',
      postalCode: '02100',
      buildYear: 2015,
      ownerships: [{ share: 50 }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no dependencies, show simple confirm dialog
    (ApiClient.fetch as unknown as jest.SpyInstance).mockResolvedValue({ canDelete: true, dependencies: [] });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders loading and then displays items', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }, { name: 'size' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Property 2')).toBeInTheDocument();
  });

  it('displays property details correctly', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }, { name: 'size' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    // Check size is displayed
    expect(screen.getByText('75 m²')).toBeInTheDocument();
    expect(screen.getByText('100 m²')).toBeInTheDocument();

    // Check build year
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('2015')).toBeInTheDocument();

    // Check partial ownership is displayed (< 100%)
    expect(screen.getByText('50 %')).toBeInTheDocument();
  });

  it('displays empty state when no items', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue([]);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No rows found')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation dialog', async () => {
    const user = userEvent.setup();
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
  });

  it('closes delete dialog on cancel', async () => {
    const user = userEvent.setup();
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to delete?')).not.toBeInTheDocument();
    });
  });

  it('deletes item when confirmed', async () => {
    const user = userEvent.setup();
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);
    (ApiClient.delete as unknown as jest.SpyInstance).mockResolvedValue({});

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Update mock to return fewer items after delete
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue([mockProperties[1]]);

    // Click the delete button in the dialog
    const allDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(ApiClient.delete).toHaveBeenCalledWith(propertyContext.apiPath, 1);
    });
  });

  it('calls API with correct parameters', async () => {
    const fetchOptions = { order: { name: 'ASC' as const } };
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue([]);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
        fetchOptions={fetchOptions}
      />
    );

    await waitFor(() => {
      expect(ApiClient.search).toHaveBeenCalledWith(
        propertyContext.apiPath,
        fetchOptions
      );
    });
  });

  it('refetches data after deletion', async () => {
    const user = userEvent.setup();
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);
    (ApiClient.delete as unknown as jest.SpyInstance).mockResolvedValue({});

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    // Initial fetch
    expect(ApiClient.search).toHaveBeenCalledTimes(1);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue([mockProperties[1]]);

    const allDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
    await user.click(confirmButton);

    // Should refetch after delete
    await waitFor(() => {
      expect(ApiClient.search).toHaveBeenCalledTimes(2);
    });
  });

  it('displays add link without routePrefix', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    const addLink = screen.getByRole('link', { name: /add/i });
    expect(addLink).toHaveAttribute('href', `${propertyContext.routePath}/add`);
  });

  it('displays add link with routePrefix', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue(mockProperties);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
        routePrefix="own"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });

    const addLink = screen.getByRole('link', { name: /add/i });
    expect(addLink).toHaveAttribute('href', `${propertyContext.routePath}/own/add`);
  });

  it('displays title', async () => {
    (ApiClient.search as unknown as jest.SpyInstance).mockResolvedValue([]);

    renderWithProviders(
      <AssetCardList
        t={mockT}
        title="My Properties"
        assetContext={propertyContext}
        fields={[{ name: 'name' as keyof TestProperty }]}
      />
    );

    expect(screen.getByText('My Properties')).toBeInTheDocument();
  });
});
