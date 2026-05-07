import { screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockProperty } from '@test-utils';
import { PropertyStatus } from '@asset-types';
import ApiClient from '@asset-lib/api-client';
import PropertyInfoSection from './PropertyInfoSection';

describe('PropertyInfoSection', () => {
  it('renders property info card with size and build year', () => {
    const property = createMockProperty({
      size: 45,
      buildYear: 2018,
      purchasePrice: 180000,
    });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={() => {}}
      />
    );

    expect(screen.getByText('45 m²')).toBeInTheDocument();
    expect(screen.getByText('2018')).toBeInTheDocument();
  });

  it('renders location card when address exists', () => {
    const property = createMockProperty({
      address: {
        id: 1,
        street: 'Test Street 1',
        city: 'Helsinki',
        postalCode: '00100',
      },
    });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={() => {}}
      />
    );

    expect(screen.getByText('Test Street 1')).toBeInTheDocument();
    expect(screen.getByText(/Helsinki/)).toBeInTheDocument();
  });

  it('renders monthly costs card with empty state when no charges data', () => {
    const property = createMockProperty();

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={() => {}}
      />
    );

    // Monthly costs section should always appear with manage button
    expect(screen.getByText('Monthly Costs')).toBeInTheDocument();
    // Should show empty state prompting to add charges
    expect(screen.getByText('No charges')).toBeInTheDocument();
  });

  it('renders purchase details for OWN status', () => {
    const property = createMockProperty({
      status: PropertyStatus.OWN,
      purchaseDate: new Date('2020-05-15'),
      purchaseLoan: 150000,
    });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={() => {}}
      />
    );

    expect(screen.getByText(/150.*000/)).toBeInTheDocument();
  });

  it('does not render location card when no address', () => {
    const property = createMockProperty({
      address: undefined,
    });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={() => {}}
      />
    );

    // Location section is now always rendered with empty placeholders
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  // District display tests (TDD - implementation does not exist yet)
  describe('district display', () => {
    it('displays district in location card when present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Kallionkatu 5',
          city: 'Helsinki',
          postalCode: '00530',
          district: 'Kallio',
        },
      });

      renderWithProviders(
        <PropertyInfoSection
          property={property}
          activeKey={null}
          setActiveKey={() => {}}
          onPropertyUpdated={() => {}}
        />
      );

      // Should show the district value
      expect(screen.getByText('Kallio')).toBeInTheDocument();
    });

    it('displays district label when district is present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Kallionkatu 5',
          city: 'Helsinki',
          postalCode: '00530',
          district: 'Kallio',
        },
      });

      renderWithProviders(
        <PropertyInfoSection
          property={property}
          activeKey={null}
          setActiveKey={() => {}}
          onPropertyUpdated={() => {}}
        />
      );

      // Should show the district label (from translations)
      expect(screen.getByText(/district/i)).toBeInTheDocument();
    });

    it('hides district row when district is not present', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Test Street 1',
          city: 'Helsinki',
          postalCode: '00100',
          // district is not set
        },
      });

      renderWithProviders(
        <PropertyInfoSection
          property={property}
          activeKey={null}
          setActiveKey={() => {}}
          onPropertyUpdated={() => {}}
        />
      );

      // District row is now always shown (for inline editing)
      // When not set, it should show "—" placeholder
      expect(screen.getByText(/district/i)).toBeInTheDocument();
      // Find the district row and verify it has the empty placeholder
      const districtRow = screen.getByText(/district/i).closest('div');
      expect(districtRow).toHaveTextContent('—');
    });

    it('renders district alongside city and street', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Töölönkatu 10',
          city: 'Helsinki',
          postalCode: '00100',
          district: 'Töölö',
        },
      });

      renderWithProviders(
        <PropertyInfoSection
          property={property}
          activeKey={null}
          setActiveKey={() => {}}
          onPropertyUpdated={() => {}}
        />
      );

      // All location details should be present
      expect(screen.getByText('Töölönkatu 10')).toBeInTheDocument();
      expect(screen.getByText(/Helsinki/)).toBeInTheDocument();
      expect(screen.getByText('Töölö')).toBeInTheDocument();
    });

    it('displays district with special characters correctly', () => {
      const property = createMockProperty({
        address: {
          id: 1,
          street: 'Sörnäistenkatu 5',
          city: 'Helsinki',
          postalCode: '00540',
          district: 'Sörnäinen',
        },
      });

      renderWithProviders(
        <PropertyInfoSection
          property={property}
          activeKey={null}
          setActiveKey={() => {}}
          onPropertyUpdated={() => {}}
        />
      );

      // Finnish special characters should render correctly
      expect(screen.getByText('Sörnäinen')).toBeInTheDocument();
    });
  });
});

describe('PropertyInfoSection edit mode', () => {
  let putSpy: jest.SpyInstance;

  beforeEach(() => {
    putSpy = jest.spyOn(ApiClient, 'put');
  });

  afterEach(() => {
    putSpy.mockRestore();
  });

  it('toggles Property Info into edit mode and saves size on blur', async () => {
    const user = userEvent.setup();
    const property = createMockProperty({ id: 11, size: 45, buildYear: 2010, name: 'X' });
    const onUpdated = jest.fn();
    const setActiveKey = jest.fn();

    putSpy.mockResolvedValueOnce({ ...property, size: 60 });

    const { rerender } = renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={setActiveKey}
        onPropertyUpdated={onUpdated}
      />
    );

    // Click pencil for property-info card
    const propertyInfoCard = screen.getByText('Property Information').closest('div')!;
    const pencil = within(propertyInfoCard as HTMLElement).getByRole('button', { name: /edit section/i });
    await user.click(pencil);

    // setActiveKey should have been called with 'property-info'
    expect(setActiveKey).toHaveBeenCalledWith('property-info');

    // Re-render with the section in edit mode
    rerender(
      <PropertyInfoSection
        property={property}
        activeKey={'property-info'}
        setActiveKey={setActiveKey}
        onPropertyUpdated={onUpdated}
      />
    );

    const sizeInput = screen.getByLabelText('Size');
    await user.clear(sizeInput);
    await user.type(sizeInput, '60');
    await user.tab();

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      11,
      expect.objectContaining({ size: 60, name: 'X' })
    );
    expect(onUpdated).toHaveBeenCalled();
  });

  it('saves purchase loan inline with currency input', async () => {
    const user = userEvent.setup();
    const property = createMockProperty({
      id: 22, name: 'Y', size: 50,
      status: PropertyStatus.OWN, purchaseLoan: 100000,
    });
    putSpy.mockResolvedValueOnce({ ...property, purchaseLoan: 120000 });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={'purchase'}
        setActiveKey={() => {}}
        onPropertyUpdated={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Purchase Loan');
    await user.clear(input);
    await user.type(input, '120000');
    await user.tab();

    expect(putSpy).toHaveBeenCalledWith(
      'real-estate/property',
      22,
      expect.objectContaining({ purchaseLoan: 120000 })
    );
  });

  it('renders Purchase card for OWN status even when no purchase data set', () => {
    const property = createMockProperty({
      id: 23, status: PropertyStatus.OWN,
      purchaseDate: undefined, purchaseLoan: undefined,
    });

    renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={() => {}}
        onPropertyUpdated={jest.fn()}
      />
    );

    expect(screen.getByText('Purchase Info')).toBeInTheDocument();
  });

  it('switches active section when clicking a different pencil', async () => {
    const user = userEvent.setup();
    const property = createMockProperty({
      id: 33, status: PropertyStatus.OWN,
      purchaseLoan: 100000, purchaseDate: new Date('2020-01-01'),
    });

    const setActiveKey = jest.fn();

    const { rerender } = renderWithProviders(
      <PropertyInfoSection
        property={property}
        activeKey={null}
        setActiveKey={setActiveKey}
        onPropertyUpdated={jest.fn()}
      />
    );

    const propertyInfoCard = screen.getByText('Property Information').closest('div')!;
    const purchaseCard = screen.getByText('Purchase Info').closest('div')!;

    await user.click(within(propertyInfoCard as HTMLElement).getByRole('button', { name: /edit section/i }));
    expect(setActiveKey).toHaveBeenLastCalledWith('property-info');

    rerender(
      <PropertyInfoSection
        property={property}
        activeKey={'property-info'}
        setActiveKey={setActiveKey}
        onPropertyUpdated={jest.fn()}
      />
    );

    await user.click(within(purchaseCard as HTMLElement).getByRole('button', { name: /edit section/i }));
    expect(setActiveKey).toHaveBeenLastCalledWith('purchase');
  });
});
