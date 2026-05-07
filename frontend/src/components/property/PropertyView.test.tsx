// frontend/src/components/property/PropertyView.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithRouter } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';
import ApiClient from '@asset-lib/api-client';
import axios from 'axios';
import { Routes, Route } from 'react-router-dom';
import { PropertyType, PropertyExternalSource } from '@asset-types';


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
        monthlyCostsSection: 'Monthly Costs',
        purchaseInfoSection: 'Purchase Info',
        maintenanceFee: 'Maintenance Fee',
        financialCharge: 'Financial Charge',
        waterCharge: 'Water Charge',
        debtShare: 'Debt Share',
        monthlyRent: 'Monthly Rent',
        purchasePrice: 'Purchase Price',
        purchaseDate: 'Purchase Date',
        purchaseLoan: 'Purchase Loan',
        editSection: 'Edit section',
        doneEditing: 'Done',
        saveError: 'Failed to save changes',
        street: 'Street',
        notSet: '—',
        // Property types
        'propertyTypes.apartment': 'Apartment',
        'propertyTypes.row-house': 'Row House',
        'propertyTypes.semi-detached': 'Semi-Detached',
        'propertyTypes.detached': 'Detached',
        'propertyTypes.separate-house': 'Separate House',
        'propertyTypes.gallery-access': 'Gallery Access',
        'propertyTypes.wooden-house': 'Wooden House',
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
function renderPropertyView(propertyId: string = '1', statusPrefix: 'own' | 'prospects' = 'own') {
  return renderWithRouter(
    <Routes>
      <Route path="/app/portfolio/own/:idParam" element={<PropertyView />} />
      <Route path="/app/portfolio/prospects/:idParam" element={<PropertyView />} />
      <Route path="/app/portfolio/own/edit/:idParam" element={<div>Edit Own Page</div>} />
      <Route path="/app/portfolio/prospects/edit/:idParam" element={<div>Edit Prospect Page</div>} />
      <Route path="/app/portfolio/own" element={<div>Own Properties List</div>} />
      <Route path="/app/portfolio/prospects" element={<div>Prospects List</div>} />
    </Routes>,
    { initialEntries: [`/app/portfolio/${statusPrefix}/${propertyId}`] }
  );
}

describe('PropertyView', () => {
  let mockGet: jest.SpyInstance;
  let mockGetOptions: jest.SpyInstance;
  let mockAxiosPost: jest.SpyInstance;

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
    apartmentType: PropertyType.APARTMENT,
    rooms: '2h+k',
    description: 'A beautiful apartment in the city center.',
    photo: 'uploads/properties/photo1.jpg',
    ownerships: [{ share: 100, userId: 1, propertyId: 1 }],
    status: 2, // PropertyStatus.OWN
  });

  beforeEach(() => {
    mockGet = jest.spyOn(ApiClient, 'get');
    mockGetOptions = jest.spyOn(ApiClient, 'getOptions').mockResolvedValue({
      withCredentials: true,
      headers: { Authorization: 'Bearer test-token' },
    });
    // Mock statistics API call
    mockAxiosPost = jest.spyOn(axios, 'post').mockResolvedValue({ data: [] });
  });

  afterEach(async () => {
    // Wait for any pending promises to settle
    await new Promise(resolve => setTimeout(resolve, 0));
    mockGet.mockRestore();
    mockGetOptions.mockRestore();
    mockAxiosPost.mockRestore();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property details correctly', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Verify basic info (property type + rooms in subtitle)
      expect(screen.getByText('Apartment · 2h+k')).toBeInTheDocument();
      expect(screen.getByText('75 m²')).toBeInTheDocument();
      expect(screen.getByText('2010')).toBeInTheDocument();

      // Verify location
      expect(screen.getByText('Mannerheimintie 1')).toBeInTheDocument();
      expect(screen.getByText('00100')).toBeInTheDocument();
      expect(screen.getByText('Helsinki')).toBeInTheDocument();

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

    it('shows ownership status ribbon', async () => {
      const partialOwnership = createMockProperty({
        ...mockProperty,
        ownerships: [{ share: 75, userId: 1, propertyId: 1 }],
      });
      mockGet.mockResolvedValue(partialOwnership);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Ribbon shows ownership status text with percentage
      expect(screen.getByText(/Ownership 75%/)).toBeInTheDocument();
    });

    it('shows ownership status ribbon for full ownership', async () => {
      mockGet.mockResolvedValue(mockProperty);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Ribbon shows ownership status text with percentage
      expect(screen.getByText(/Ownership 100%/)).toBeInTheDocument();
    });

    it('shows location section with empty placeholders when no address', async () => {
      const propertyNoLocation = createMockProperty({
        ...mockProperty,
        address: undefined,
      });
      mockGet.mockResolvedValue(propertyNoLocation);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      expect(screen.getByText('Location')).toBeInTheDocument();
      // At least one '—' placeholder for empty fields
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('shows description section with edit button when no description', async () => {
      const propertyNoDesc = createMockProperty({
        ...mockProperty,
        description: undefined,
      });
      mockGet.mockResolvedValue(propertyNoDesc);

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Description section should now always be shown (to allow inline editing)
      const descHeaders = screen.queryAllByText('Description');
      expect(descHeaders.length).toBeGreaterThan(0);
      // Should have an edit button for the description section
      const editButtons = screen.getAllByRole('button', { name: /edit section/i });
      expect(editButtons.length).toBeGreaterThan(0);
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
    it('Edit menu item navigates to edit page for own property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 2 }); // PropertyStatus.OWN = 2

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Open the actions menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Click Edit in the menu
      const editMenuItem = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editMenuItem);

      // After clicking edit, we should navigate to the edit page for own properties
      await waitFor(() => {
        expect(screen.getByText('Edit Own Page')).toBeInTheDocument();
      });
    });

    it('Edit menu item navigates to edit page for prospect property', async () => {
      const user = userEvent.setup();
      mockGet.mockResolvedValue({ ...mockProperty, status: 1 }); // PropertyStatus.PROSPECT = 1

      renderPropertyView();

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });

      // Open the actions menu
      const menuButton = screen.getByRole('button', { name: /property actions/i });
      await user.click(menuButton);

      // Click Edit in the menu
      const editMenuItem = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editMenuItem);

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

  describe('Route-based navigation', () => {
    it('renders correctly when accessed via own route', async () => {
      mockGet.mockResolvedValue({ ...mockProperty, status: 2 }); // PropertyStatus.OWN = 2

      renderPropertyView('1', 'own');

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });
    });

    it('renders correctly when accessed via prospects route', async () => {
      mockGet.mockResolvedValue({ ...mockProperty, status: 1 }); // PropertyStatus.PROSPECT = 1

      renderPropertyView('1', 'prospects');

      await waitFor(() => {
        expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      });
    });
  });

  describe('External listing link', () => {
    it('does NOT show external listing link in view content for prospect properties', async () => {
      const prospectProperty = createMockProperty({
        id: 1,
        name: 'Prospect Property',
        status: 1, // PropertyStatus.PROSPECT = 1
        externalSource: PropertyExternalSource.ETUOVI,
        externalSourceId: '12345',
      });

      mockGet.mockResolvedValue(prospectProperty);

      renderPropertyView('1', 'prospects');

      // Wait for property to load
      await waitFor(() => {
        expect(screen.getByText('Prospect Property')).toBeInTheDocument();
      });

      // The external listing link should NOT be in the view content
      // It should only be accessible via the actions menu
      // Check for the actual link to etuovi.com
      const externalLink = document.querySelector('a[href*="etuovi.com/kohde/12345"]');
      expect(externalLink).not.toBeInTheDocument();
    });
  });

  describe('Inline editing', () => {
    it('saves description inline from the Description card', async () => {
      const user = userEvent.setup();

      const property = createMockProperty({
        id: 1,
        name: 'X',
        size: 50,
        description: 'old description',
      });

      const getSpy = jest.spyOn(ApiClient, 'get').mockResolvedValue(property);
      const putSpy = jest.spyOn(ApiClient, 'put').mockResolvedValueOnce({
        ...property,
        description: 'new description',
      });

      renderPropertyView('1', 'own');

      await waitFor(() => expect(screen.getByText('old description')).toBeInTheDocument());

      // Click the edit section button (pencil icon) - find all buttons with that name and click the one for description
      const editButtons = screen.getAllByRole('button', { name: /edit section/i });
      // The description edit button should be the last one (after the info section buttons)
      const descriptionEditButton = editButtons[editButtons.length - 1];
      await user.click(descriptionEditButton);

      const textarea = screen.getByLabelText('Description');
      await user.clear(textarea);
      await user.type(textarea, 'new description');
      await user.tab();

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith(
          'real-estate/property',
          1,
          expect.objectContaining({ description: 'new description' })
        );
      });

      getSpy.mockRestore();
      putSpy.mockRestore();
    });
  });
});
