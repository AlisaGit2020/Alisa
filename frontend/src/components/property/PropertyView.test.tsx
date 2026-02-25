// frontend/src/components/property/PropertyView.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithRouter } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import ApiClient from '@asset-lib/api-client';
import { Routes, Route } from 'react-router-dom';

// Mock the withTranslation HOC
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  withTranslation: () => <P extends { t?: (key: string) => string }>(Component: React.ComponentType<P>) => {
    const WrappedComponent = (props: Omit<P, 't'>) => {
      const translations: Record<string, string> = {
        viewPageTitle: 'Property Details',
        propertyInfo: 'Property Information',
        locationInfo: 'Location',
        statisticsSection: 'Statistics',
        statisticsComingSoon: 'Financial statistics coming soon',
        editProperty: 'Edit',
        back: 'Back',
        name: 'Name',
        size: 'Size',
        description: 'Description',
        address: 'Address',
        city: 'City',
        postalCode: 'Postal code',
        buildYear: 'Build year',
        apartmentType: 'Apartment type',
        ownershipShare: 'Ownership share',
      };
      const t = (key: string) => translations[key] || key;
      return <Component {...(props as P)} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Import after mocking
import PropertyView from './PropertyView';

// Helper to render PropertyView with route params
function renderPropertyView(propertyId: string = '1') {
  return renderWithRouter(
    <Routes>
      <Route path="/app/portfolio/properties/:idParam" element={<PropertyView />} />
      <Route path="/app/portfolio/properties/own/edit/:idParam" element={<div>Edit Own Page</div>} />
      <Route path="/app/portfolio/properties/prospects/edit/:idParam" element={<div>Edit Prospect Page</div>} />
      <Route path="/app/portfolio/properties/own" element={<div>Own Properties List</div>} />
      <Route path="/app/portfolio/properties/prospects" element={<div>Prospects List</div>} />
    </Routes>,
    { initialEntries: [`/app/portfolio/properties/${propertyId}`] }
  );
}

describe('PropertyView', () => {
  let mockGet: jest.SpyInstance;

  const mockProperty = createMockProperty({
    id: 1,
    name: 'Helsinki Apartment',
    address: {
      id: 1,
      street: 'Mannerheimintie 1',
      city: 'Helsinki',
      postalCode: '00100',
    },
    size: 75,
    buildYear: 2010,
    apartmentType: '2h+k',
    description: 'A beautiful apartment in the city center.',
    photo: 'uploads/properties/photo1.jpg',
    ownerships: [{ share: 100, userId: 1, propertyId: 1 }],
  });

  beforeEach(() => {
    mockGet = jest.spyOn(ApiClient, 'get');
  });

  afterEach(() => {
    mockGet.mockRestore();
  });

  describe('Rendering', () => {
    it('renders property details correctly', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Verify basic info
      expect(screen.getByText('2h+k')).toBeInTheDocument();
      expect(screen.getByText('75 m²')).toBeInTheDocument();
      expect(screen.getByText('2010')).toBeInTheDocument();

      // Verify location
      expect(screen.getByText('Mannerheimintie 1')).toBeInTheDocument();
      expect(screen.getByText('00100 Helsinki')).toBeInTheDocument();

      // Verify description
      expect(screen.getByText('A beautiful apartment in the city center.')).toBeInTheDocument();

      // Verify section headers
      expect(screen.getByText('Property Information')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    it('displays property image when available', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const image = screen.getByRole('img', { name: 'Helsinki Apartment' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', expect.stringContaining('uploads/properties/photo1.jpg'));
    });

    it('displays placeholder image when property has no photo', async () => {
      const propertyWithoutPhoto = createMockProperty({
        ...mockProperty,
        photo: undefined,
      });
      mockGet.mockResolvedValue(propertyWithoutPhoto);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const image = screen.getByRole('img', { name: 'Helsinki Apartment' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/assets/properties/placeholder.svg');
    });

    it('shows ownership share with circular badge', async () => {
      const partialOwnership = createMockProperty({
        ...mockProperty,
        ownerships: [{ share: 75, userId: 1, propertyId: 1 }],
      });
      mockGet.mockResolvedValue(partialOwnership);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Ownership share')).toBeInTheDocument();
    });

    it('shows 100% ownership share', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('hides location section when no address or city', async () => {
      const propertyNoLocation = createMockProperty({
        ...mockProperty,
        address: undefined,
      });
      mockGet.mockResolvedValue(propertyNoLocation);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Location')).not.toBeInTheDocument();
    });

    it('hides description section when no description', async () => {
      const propertyNoDesc = createMockProperty({
        ...mockProperty,
        description: undefined,
      });
      mockGet.mockResolvedValue(propertyNoDesc);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Description header should not be shown
      const descHeaders = screen.queryAllByText('Description');
      expect(descHeaders).toHaveLength(0);
    });
  });

  describe('Loading state', () => {
    it('shows loading progress while fetching', async () => {
      // Create a promise that we control
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGet.mockReturnValue(promise);

      renderPropertyView();

      // Check for loading indicator (LinearProgress)
      expect(document.querySelector('.MuiLinearProgress-root')).toBeInTheDocument();

      // Resolve and wait for property to load
      resolvePromise!(mockProperty);

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });
    });
  });

  describe('Error states', () => {
    it('shows error message when API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Failed to load property')).toBeInTheDocument();
      });
    });

    it('shows error when property ID not found', async () => {
      mockGet.mockResolvedValue(null);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Property not found')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('Edit button navigates to edit page for own property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 2 }); // PropertyStatus.OWN = 2

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // After clicking edit, we should navigate to the edit page for own properties
      await waitFor(() => {
        expect(screen.getByText('Edit Own Page')).toBeInTheDocument();
      });
    });

    it('Edit button navigates to edit page for prospect property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 1 }); // PropertyStatus.PROSPECT = 1

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // After clicking edit, we should navigate to the edit page for prospects
      await waitFor(() => {
        expect(screen.getByText('Edit Prospect Page')).toBeInTheDocument();
      });
    });

    it('Back button navigates to own properties list for own property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 2 }); // PropertyStatus.OWN = 2

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // After clicking back, we should navigate to the own properties list
      await waitFor(() => {
        expect(screen.getByText('Own Properties List')).toBeInTheDocument();
      });
    });

    it('Back button navigates to prospects list for prospect property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 1 }); // PropertyStatus.PROSPECT = 1

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // After clicking back, we should navigate to the prospects list
      await waitFor(() => {
        expect(screen.getByText('Prospects List')).toBeInTheDocument();
      });
    });
  });

  describe('API calls', () => {
    it('calls API with correct property ID and relations', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView('42');

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('real-estate/property', 42, { ownerships: true });
      });
    });
  });
});
