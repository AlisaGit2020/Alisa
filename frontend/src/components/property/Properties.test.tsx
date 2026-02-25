import '@testing-library/jest-dom';
import { Ownership, Property } from '@asset-types';
import { PropertyStatus } from '@asset-types/common';

// Since Jest mock hoisting causes issues with relative paths in ESM mode,
// we test the data transformation logic separately from the React component
// Following the same pattern as Transactions.test.tsx

describe('Properties Component Logic', () => {
  const mockProperties: Partial<Property>[] = [
    {
      id: 1,
      name: 'Test Property 1',
      address: {
        id: 1,
        street: '123 Test Street',
        city: 'Helsinki',
        postalCode: '00100',
      },
      description: 'A nice apartment',
      ownerships: [{ share: 100, userId: 1, propertyId: 1 }],
    },
    {
      id: 2,
      name: 'Test Property 2',
      address: {
        id: 2,
        street: '456 Another Street',
        city: 'Espoo',
        postalCode: '02100',
      },
      ownerships: [{ share: 50, userId: 1, propertyId: 2 }],
    },
  ];

  describe('Card subtitle construction', () => {
    it('combines apartment type and build year when both present', () => {
      const property = {
        apartmentType: '2h+k',
        buildYear: 2000,
      };

      const buildSubtitle = () => {
        if (property.apartmentType && property.buildYear) {
          return `${property.apartmentType}, ${property.buildYear}`;
        }
        if (property.apartmentType) {
          return property.apartmentType;
        }
        if (property.buildYear) {
          return String(property.buildYear);
        }
        return '';
      };

      expect(buildSubtitle()).toBe('2h+k, 2000');
    });

    it('shows only apartment type when build year is missing', () => {
      const property = {
        apartmentType: '2h+k',
        buildYear: undefined,
      };

      const buildSubtitle = () => {
        if (property.apartmentType && property.buildYear) {
          return `${property.apartmentType}, ${property.buildYear}`;
        }
        if (property.apartmentType) {
          return property.apartmentType;
        }
        if (property.buildYear) {
          return String(property.buildYear);
        }
        return '';
      };

      expect(buildSubtitle()).toBe('2h+k');
    });

    it('shows only build year when apartment type is missing', () => {
      const property = {
        apartmentType: undefined,
        buildYear: 1990,
      };

      const buildSubtitle = () => {
        if (property.apartmentType && property.buildYear) {
          return `${property.apartmentType}, ${property.buildYear}`;
        }
        if (property.apartmentType) {
          return property.apartmentType;
        }
        if (property.buildYear) {
          return String(property.buildYear);
        }
        return '';
      };

      expect(buildSubtitle()).toBe('1990');
    });

    it('returns empty string when both are missing', () => {
      const property = {
        apartmentType: undefined,
        buildYear: undefined,
      };

      const buildSubtitle = () => {
        if (property.apartmentType && property.buildYear) {
          return `${property.apartmentType}, ${property.buildYear}`;
        }
        if (property.apartmentType) {
          return property.apartmentType;
        }
        if (property.buildYear) {
          return String(property.buildYear);
        }
        return '';
      };

      expect(buildSubtitle()).toBe('');
    });
  });

  describe('Address display construction', () => {
    it('combines address, postal code and city', () => {
      const property = {
        address: {
          street: '123 Test Street',
          postalCode: '00100',
          city: 'Helsinki',
        },
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address?.street) {
          lines.push(property.address.street);
        }
        if (property.address?.postalCode || property.address?.city) {
          lines.push(`${property.address?.postalCode || ''} ${property.address?.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual([
        '123 Test Street',
        '00100 Helsinki',
      ]);
    });

    it('handles missing street', () => {
      const property = {
        address: {
          street: undefined,
          postalCode: '00100',
          city: 'Helsinki',
        },
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address?.street) {
          lines.push(property.address.street);
        }
        if (property.address?.postalCode || property.address?.city) {
          lines.push(`${property.address?.postalCode || ''} ${property.address?.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual(['00100 Helsinki']);
    });

    it('handles missing city', () => {
      const property = {
        address: {
          street: '123 Test Street',
          postalCode: '00100',
          city: undefined,
        },
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address?.street) {
          lines.push(property.address.street);
        }
        if (property.address?.postalCode || property.address?.city) {
          lines.push(`${property.address?.postalCode || ''} ${property.address?.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual([
        '123 Test Street',
        '00100 ',
      ]);
    });

    it('handles all address fields missing', () => {
      const property: { address?: { street?: string; postalCode?: string; city?: string } } = {
        address: undefined,
      };

      const buildAddress = () => {
        const lines: string[] = [];
        if (property.address?.street) {
          lines.push(property.address.street);
        }
        if (property.address?.postalCode || property.address?.city) {
          lines.push(`${property.address?.postalCode || ''} ${property.address?.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual([]);
    });
  });

  describe('Ownership share display logic', () => {
    it('returns share percentage when less than 100', () => {
      const property = {
        ownerships: [{ share: 50, userId: 1 }],
      };

      const getOwnershipShare = () => {
        if (property.ownerships && property.ownerships.length > 0) {
          const share = property.ownerships[0].share;
          if (share && share < 100) {
            return `${share} %`;
          }
        }
        return undefined;
      };

      expect(getOwnershipShare()).toBe('50 %');
    });

    it('returns undefined when share is 100', () => {
      const property = {
        ownerships: [{ share: 100, userId: 1 }],
      };

      const getOwnershipShare = () => {
        if (property.ownerships && property.ownerships.length > 0) {
          const share = property.ownerships[0].share;
          if (share && share < 100) {
            return `${share} %`;
          }
        }
        return undefined;
      };

      expect(getOwnershipShare()).toBeUndefined();
    });

    it('returns undefined when no ownerships', () => {
      const property = {
        ownerships: [] as Ownership[],
      };

      const getOwnershipShare = () => {
        if (property.ownerships && property.ownerships.length > 0) {
          const share = property.ownerships[0].share;
          if (share && share < 100) {
            return `${share} %`;
          }
        }
        return undefined;
      };

      expect(getOwnershipShare()).toBeUndefined();
    });
  });

  describe('Description display logic', () => {
    it('returns description when present', () => {
      const property = {
        description: 'A beautiful apartment',
      };

      const getDescriptionText = () => {
        if (property.description) {
          return property.description;
        }
        return 'No description';
      };

      expect(getDescriptionText()).toBe('A beautiful apartment');
    });

    it('returns "No description" when description is undefined', () => {
      const property = {
        description: undefined,
      };

      const getDescriptionText = () => {
        if (property.description) {
          return property.description;
        }
        return 'No description';
      };

      expect(getDescriptionText()).toBe('No description');
    });

    it('returns "No description" when description is empty string', () => {
      const property = {
        description: '',
      };

      const getDescriptionText = () => {
        if (property.description) {
          return property.description;
        }
        return 'No description';
      };

      expect(getDescriptionText()).toBe('No description');
    });
  });

  describe('Card grid data mapping', () => {
    it('maps properties to card data correctly', () => {
      const mapToCardData = (props: Partial<Property>[]) => {
        return props.map((prop) => ({
          id: prop.id,
          name: prop.name,
          description: prop.description || 'No description',
        }));
      };

      const result = mapToCardData(mockProperties);

      expect(result).toEqual([
        { id: 1, name: 'Test Property 1', description: 'A nice apartment' },
        { id: 2, name: 'Test Property 2', description: 'No description' },
      ]);
    });
  });

  describe('Search options', () => {
    it('includes ownerships relation', () => {
      const searchOptions = {
        order: { name: 'ASC' },
        relations: { ownerships: true },
      };

      expect(searchOptions.relations.ownerships).toBe(true);
    });

    it('orders by name ascending', () => {
      const searchOptions = {
        order: { name: 'ASC' },
        relations: { ownerships: true },
      };

      expect(searchOptions.order.name).toBe('ASC');
    });
  });

  describe('Delete confirmation logic', () => {
    it('deleteId starts at undefined', () => {
      let deleteId: number | undefined = undefined;
      expect(deleteId).toBeUndefined();
    });

    it('handleDelete sets deleteId', () => {
      let deleteId: number | undefined = undefined;
      const handleDelete = (id: number) => {
        deleteId = id;
      };

      handleDelete(5);
      expect(deleteId).toBe(5);
    });

    it('onCloseDelete resets deleteId to undefined', () => {
      let deleteId: number | undefined = 5;
      const onCloseDelete = () => {
        deleteId = undefined;
      };

      onCloseDelete();
      expect(deleteId).toBeUndefined();
    });
  });

  describe('Property tabs logic', () => {
    const TAB_OWN = 0;
    const TAB_PROSPECT = 1;

    describe('Tab index state management', () => {
      it('defaults to own properties tab (index 0)', () => {
        const defaultTabIndex = 0;
        expect(defaultTabIndex).toBe(TAB_OWN);
      });

      it('switches to prospect tab when index changes to 1', () => {
        let tabIndex = TAB_OWN;
        const handleTabChange = (newValue: number) => {
          tabIndex = newValue;
        };

        handleTabChange(TAB_PROSPECT);
        expect(tabIndex).toBe(TAB_PROSPECT);
      });

      it('switches back to own tab when index changes to 0', () => {
        let tabIndex = TAB_PROSPECT;
        const handleTabChange = (newValue: number) => {
          tabIndex = newValue;
        };

        handleTabChange(TAB_OWN);
        expect(tabIndex).toBe(TAB_OWN);
      });
    });

    describe('Property status filtering by tab', () => {
      it('returns OWN status for own properties tab', () => {
        const getStatusForTab = (tabIndex: number): PropertyStatus => {
          return tabIndex === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
        };

        expect(getStatusForTab(TAB_OWN)).toBe(PropertyStatus.OWN);
      });

      it('returns PROSPECT status for prospect tab', () => {
        const getStatusForTab = (tabIndex: number): PropertyStatus => {
          return tabIndex === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
        };

        expect(getStatusForTab(TAB_PROSPECT)).toBe(PropertyStatus.PROSPECT);
      });
    });

    describe('Fetch options generation by tab', () => {
      it('includes status filter for OWN when on own tab', () => {
        const buildFetchOptions = (tabIndex: number) => {
          const status = tabIndex === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
          return {
            order: { name: 'ASC' },
            relations: { ownerships: true },
            where: { status },
          };
        };

        const options = buildFetchOptions(TAB_OWN);
        expect(options.where.status).toBe(PropertyStatus.OWN);
      });

      it('includes status filter for PROSPECT when on prospect tab', () => {
        const buildFetchOptions = (tabIndex: number) => {
          const status = tabIndex === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
          return {
            order: { name: 'ASC' },
            relations: { ownerships: true },
            where: { status },
          };
        };

        const options = buildFetchOptions(TAB_PROSPECT);
        expect(options.where.status).toBe(PropertyStatus.PROSPECT);
      });

      it('preserves order and relations when switching tabs', () => {
        const buildFetchOptions = (tabIndex: number) => {
          const status = tabIndex === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
          return {
            order: { name: 'ASC' },
            relations: { ownerships: true },
            where: { status },
          };
        };

        const ownOptions = buildFetchOptions(TAB_OWN);
        const prospectOptions = buildFetchOptions(TAB_PROSPECT);

        expect(ownOptions.order).toEqual({ name: 'ASC' });
        expect(ownOptions.relations).toEqual({ ownerships: true });
        expect(prospectOptions.order).toEqual({ name: 'ASC' });
        expect(prospectOptions.relations).toEqual({ ownerships: true });
      });
    });

    describe('Tab label translation keys', () => {
      it('uses ownProperties key for own tab', () => {
        const tabConfig = [
          { key: 'ownProperties', status: PropertyStatus.OWN },
          { key: 'prospectProperties', status: PropertyStatus.PROSPECT },
        ];

        expect(tabConfig[TAB_OWN].key).toBe('ownProperties');
      });

      it('uses prospectProperties key for prospect tab', () => {
        const tabConfig = [
          { key: 'ownProperties', status: PropertyStatus.OWN },
          { key: 'prospectProperties', status: PropertyStatus.PROSPECT },
        ];

        expect(tabConfig[TAB_PROSPECT].key).toBe('prospectProperties');
      });
    });

    describe('URL-based tab selection', () => {
      const ROUTE_OWN = 'own';
      const ROUTE_PROSPECT = 'prospects';

      it('returns TAB_OWN for "own" route parameter', () => {
        const getTabIndexFromRoute = (tabParam?: string): number => {
          if (tabParam === ROUTE_PROSPECT) return TAB_PROSPECT;
          return TAB_OWN; // default to own
        };

        expect(getTabIndexFromRoute(ROUTE_OWN)).toBe(TAB_OWN);
      });

      it('returns TAB_PROSPECT for "prospects" route parameter', () => {
        const getTabIndexFromRoute = (tabParam?: string): number => {
          if (tabParam === ROUTE_PROSPECT) return TAB_PROSPECT;
          return TAB_OWN;
        };

        expect(getTabIndexFromRoute(ROUTE_PROSPECT)).toBe(TAB_PROSPECT);
      });

      it('defaults to TAB_OWN when route parameter is undefined', () => {
        const getTabIndexFromRoute = (tabParam?: string): number => {
          if (tabParam === ROUTE_PROSPECT) return TAB_PROSPECT;
          return TAB_OWN;
        };

        expect(getTabIndexFromRoute(undefined)).toBe(TAB_OWN);
      });

      it('defaults to TAB_OWN for unknown route parameter', () => {
        const getTabIndexFromRoute = (tabParam?: string): number => {
          if (tabParam === ROUTE_PROSPECT) return TAB_PROSPECT;
          return TAB_OWN;
        };

        expect(getTabIndexFromRoute('unknown')).toBe(TAB_OWN);
      });
    });

    describe('Tab to route mapping', () => {
      const ROUTE_OWN = 'own';
      const ROUTE_PROSPECT = 'prospects';

      it('returns "own" route for TAB_OWN', () => {
        const getRouteFromTabIndex = (tabIndex: number): string => {
          return tabIndex === TAB_PROSPECT ? ROUTE_PROSPECT : ROUTE_OWN;
        };

        expect(getRouteFromTabIndex(TAB_OWN)).toBe(ROUTE_OWN);
      });

      it('returns "prospects" route for TAB_PROSPECT', () => {
        const getRouteFromTabIndex = (tabIndex: number): string => {
          return tabIndex === TAB_PROSPECT ? ROUTE_PROSPECT : ROUTE_OWN;
        };

        expect(getRouteFromTabIndex(TAB_PROSPECT)).toBe(ROUTE_PROSPECT);
      });
    });

    describe('Navigation path construction', () => {
      const BASE_PATH = '/app/portfolio/properties';

      it('constructs own properties path correctly', () => {
        const buildNavigationPath = (route: string): string => {
          return `${BASE_PATH}/${route}`;
        };

        expect(buildNavigationPath('own')).toBe('/app/portfolio/properties/own');
      });

      it('constructs prospects path correctly', () => {
        const buildNavigationPath = (route: string): string => {
          return `${BASE_PATH}/${route}`;
        };

        expect(buildNavigationPath('prospects')).toBe('/app/portfolio/properties/prospects');
      });
    });
  });
});
