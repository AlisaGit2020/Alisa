import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import { Property } from '@asset-types/entities';
import { PropertyStatus } from '@asset-types/common';
import PropertyListHeader from './PropertyListHeader';

// Helper to create mock property
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 1,
  name: '1h + kt + kph + lasitettu parveke',
  size: 55,
  status: PropertyStatus.PROSPECT,
  photo: '/uploads/properties/test-photo.jpg',
  address: {
    id: 1,
    street: 'Pitkäkatu 51',
    city: 'Vaasa',
    postalCode: '65100',
  },
  ...overrides,
});

describe('PropertyListHeader', () => {
  describe('Rendering', () => {
    it('renders property avatar with photo', () => {
      const property = createMockProperty({ photo: '/uploads/properties/apartment.jpg' });

      renderWithProviders(<PropertyListHeader property={property} />);

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', expect.stringContaining('apartment.jpg'));
    });

    it('renders placeholder avatar when no photo', () => {
      const property = createMockProperty({ photo: undefined });

      renderWithProviders(<PropertyListHeader property={property} />);

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });

    it('displays street as primary text and property name in secondary', () => {
      const property = createMockProperty({
        name: '2h + kt + s',
        address: { id: 1, street: 'Kauppapuistikko 24', city: 'Vaasa', postalCode: '65100' },
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      // Primary: street
      expect(screen.getByText('Kauppapuistikko 24')).toBeInTheDocument();
      // Secondary: name + city + size
      expect(screen.getByText(/2h \+ kt \+ s/)).toBeInTheDocument();
    });

    it('displays only street when property has no name', () => {
      const property = createMockProperty({
        name: undefined,
        address: { id: 1, street: 'Mannerheimintie 1', city: 'Helsinki', postalCode: '00100' },
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByText('Mannerheimintie 1')).toBeInTheDocument();
    });

    it('displays only property name when no street', () => {
      const property = createMockProperty({
        name: '3h + kt',
        address: undefined,
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByText('3h + kt')).toBeInTheDocument();
    });

    it('displays fallback text when no name and no street', () => {
      const property = createMockProperty({
        id: 42,
        name: undefined,
        address: undefined,
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByText('Property 42')).toBeInTheDocument();
    });

    it('has data-testid for testing', () => {
      const property = createMockProperty({ id: 5 });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByTestId('property-list-header-5')).toBeInTheDocument();
    });
  });

  describe('Secondary Info', () => {
    it('displays city and size in secondary text', () => {
      const property = createMockProperty({
        size: 75,
        address: { id: 1, street: 'Test Street', city: 'Helsinki', postalCode: '00100' },
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      // City and size are combined with bullet separator
      expect(screen.getByText(/Helsinki.*75/)).toBeInTheDocument();
    });

    it('displays only city when no size and no name', () => {
      const property = createMockProperty({
        name: undefined,
        size: undefined,
        address: { id: 1, street: 'Test Street', city: 'Vaasa', postalCode: '65100' },
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByText('Vaasa')).toBeInTheDocument();
    });

    it('displays only size when no city and no name', () => {
      const property = createMockProperty({
        name: undefined,
        size: 80,
        address: { id: 1, street: 'Test Street', city: undefined, postalCode: '00100' },
      });

      renderWithProviders(<PropertyListHeader property={property} />);

      expect(screen.getByText('80 m²')).toBeInTheDocument();
    });
  });
});
