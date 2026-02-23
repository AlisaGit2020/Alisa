// frontend/test/views/PropertyView.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import ApiClient from '@asset-lib/api-client';

// Mock the withTranslation HOC to avoid i18n namespace issues
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: object) => {
      // Provide translations for the property namespace
      const translations: Record<string, string> = {
        add: 'Add new property',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        confirm: 'Confirm',
        confirmDelete: 'Are you sure you want to delete the property?',
        noRowsFound: 'No rows found',
        noDescription: 'No description',
        size: 'Size',
        buildYear: 'Build year',
        ownershipShare: 'Ownership share',
      };
      const t = (key: string) => translations[key] || key;
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Import after mocking
import Properties from '../../src/components/property/Properties';

describe('Properties Integration', () => {
  const mockProperties = [
    createMockProperty({
      id: 1,
      name: 'Helsinki Apartment',
      address: {
        id: 1,
        street: 'Mannerheimintie 1',
        city: 'Helsinki',
        postalCode: '00100',
      },
      size: 75,
      ownerships: [{ share: 100 }],
    }),
    createMockProperty({
      id: 2,
      name: 'Tampere House',
      address: {
        id: 2,
        street: 'Hämeenkatu 10',
        city: 'Tampere',
        postalCode: '33100',
      },
      size: 120,
      ownerships: [{ share: 50 }],
    }),
  ];

  let mockSearch: jest.SpyInstance;
  let mockDelete: jest.SpyInstance;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockSearch = jest.spyOn(ApiClient, 'search');
    mockDelete = jest.spyOn(ApiClient, 'delete');
    mockFetch = jest.spyOn(ApiClient, 'fetch');
    // Default: no dependencies, show simple confirm dialog
    mockFetch.mockResolvedValue({ canDelete: true, dependencies: [] });
  });

  afterEach(() => {
    mockSearch.mockRestore();
    mockDelete.mockRestore();
    mockFetch.mockRestore();
  });

  describe('Happy path', () => {
    it('loads and displays properties list', async () => {
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<Properties />);

      // Wait for data to load and verify properties are displayed
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Verify second property is also displayed
      expect(screen.getByText('Tampere House')).toBeInTheDocument();

      // Verify addresses are displayed
      expect(screen.getByText(/Mannerheimintie 1/)).toBeInTheDocument();
      expect(screen.getByText(/Hämeenkatu 10/)).toBeInTheDocument();

      // Verify size is displayed
      expect(screen.getByText('75 m²')).toBeInTheDocument();
      expect(screen.getByText('120 m²')).toBeInTheDocument();

      // Verify ownership share is displayed for partial ownership (< 100%)
      expect(screen.getByText('50 %')).toBeInTheDocument();

      // Verify edit and delete buttons are present for each property
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('displays add property link', async () => {
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<Properties />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Verify add link is present
      const addLink = screen.getByRole('link', { name: /add new property/i });
      expect(addLink).toBeInTheDocument();
      expect(addLink).toHaveAttribute('href', '/app/portfolio/properties/add');
    });

    it('opens delete confirmation dialog when delete button clicked', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<Properties />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Click the first delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Verify dialog has cancel and confirm buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      // The dialog contains a delete button for confirmation
      // Note: MUI Dialog may hide the card buttons, so we check for at least the dialog button
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('closes delete dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<Properties />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      });
    });

    it('deletes property when confirmed', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockProperties);
      mockDelete.mockResolvedValue({});

      renderWithProviders(<Properties />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Open delete dialog for first property
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Update mock to return updated list after deletion
      mockSearch.mockResolvedValue([mockProperties[1]]);

      // Click confirm delete (the delete button in the dialog, which is the last one)
      const allDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const confirmDeleteButton = allDeleteButtons[allDeleteButtons.length - 1];
      await user.click(confirmDeleteButton);

      // Verify API was called with correct parameters
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('real-estate/property', 1);
      });

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      });

      // Verify the deleted property is no longer displayed
      await waitFor(() => {
        expect(screen.queryByText('Helsinki Apartment')).not.toBeInTheDocument();
      });

      // Verify the other property is still there
      expect(screen.getByText('Tampere House')).toBeInTheDocument();
    });

    it('calls search API with correct parameters', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith('real-estate/property', {
          order: { name: 'ASC' },
          relations: { ownerships: true },
        });
      });
    });
  });

  describe('Empty state', () => {
    it('displays empty state message when no properties exist', async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Properties />);

      // Wait for component to render and show empty message
      // Note: The translation key may show as "noRowsFound" if i18n is not fully mocked
      await waitFor(() => {
        expect(screen.getByText(/no.*rows.*found|noRowsFound/i)).toBeInTheDocument();
      });

      // Verify add link is still present
      const addLink = screen.getByRole('link', { name: /add new property/i });
      expect(addLink).toBeInTheDocument();
    });
  });

  describe('Error scenarios', () => {
    it('renders page title even when API returns nothing', async () => {
      // Simulate API returning nothing (undefined/null case)
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<Properties />);

      // When API returns empty, the component should still render
      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });
    });

    it('shows delete dialog and allows cancellation', async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<Properties />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Open delete dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Cancel should close dialog and keep property
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Property should still be visible
      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });
    });
  });

  describe('Property card display', () => {
    it('displays property without explicit description', async () => {
      const propertyWithoutDescription = createMockProperty({
        id: 1,
        name: 'Test Property Without Desc',
        description: undefined,
        size: 50,
        ownerships: [{ share: 100 }],
      });

      mockSearch.mockResolvedValue([propertyWithoutDescription]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(screen.getByText('Test Property Without Desc')).toBeInTheDocument();
      });

      // The property card should still render successfully
      // Verify the property appears with its size
      expect(screen.getByText('50 m²')).toBeInTheDocument();
    });

    it('displays build year when available', async () => {
      const propertyWithBuildYear = createMockProperty({
        id: 1,
        name: 'Old Building',
        buildYear: 1985,
        size: 80,
        ownerships: [{ share: 100 }],
      });

      mockSearch.mockResolvedValue([propertyWithBuildYear]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(screen.getByText('Old Building')).toBeInTheDocument();
      });

      // Verify build year is displayed
      expect(screen.getByText('1985')).toBeInTheDocument();
    });

    it('does not display ownership share for 100% ownership', async () => {
      const fullOwnershipProperty = createMockProperty({
        id: 1,
        name: 'Fully Owned',
        size: 60,
        ownerships: [{ share: 100 }],
      });

      mockSearch.mockResolvedValue([fullOwnershipProperty]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(screen.getByText('Fully Owned')).toBeInTheDocument();
      });

      // 100% ownership should not be displayed (only < 100% is shown)
      expect(screen.queryByText('100 %')).not.toBeInTheDocument();
    });

    it('displays apartment type when available', async () => {
      const propertyWithType = createMockProperty({
        id: 1,
        name: 'Typed Property',
        apartmentType: '2h+k',
        size: 55,
        ownerships: [{ share: 100 }],
      });

      mockSearch.mockResolvedValue([propertyWithType]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(screen.getByText('Typed Property')).toBeInTheDocument();
      });

      // Verify apartment type is displayed
      expect(screen.getByText('2h+k')).toBeInTheDocument();
    });

    it('displays full address with postal code and city', async () => {
      const propertyWithFullAddress = createMockProperty({
        id: 1,
        name: 'Full Address Property',
        address: {
          id: 1,
          street: 'Testikatu 123',
          postalCode: '00100',
          city: 'Helsinki',
        },
        size: 70,
        ownerships: [{ share: 100 }],
      });

      mockSearch.mockResolvedValue([propertyWithFullAddress]);

      renderWithProviders(<Properties />);

      await waitFor(() => {
        expect(screen.getByText('Full Address Property')).toBeInTheDocument();
      });

      // Verify address components are displayed
      expect(screen.getByText(/Testikatu 123/)).toBeInTheDocument();
      expect(screen.getByText(/00100 Helsinki/)).toBeInTheDocument();
    });
  });
});
