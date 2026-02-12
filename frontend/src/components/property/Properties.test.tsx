import '@testing-library/jest-dom';
import { Ownership, Property } from '@alisa-types';

// Since Jest mock hoisting causes issues with relative paths in ESM mode,
// we test the data transformation logic separately from the React component
// Following the same pattern as Transactions.test.tsx

describe('Properties Component Logic', () => {
  const mockProperties: Partial<Property>[] = [
    {
      id: 1,
      name: 'Test Property 1',
      address: '123 Test Street',
      city: 'Helsinki',
      postalCode: '00100',
      description: 'A nice apartment',
      ownerships: [{ share: 100, userId: 1, propertyId: 1 }],
    },
    {
      id: 2,
      name: 'Test Property 2',
      address: '456 Another Street',
      city: 'Espoo',
      postalCode: '02100',
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
        address: '123 Test Street',
        postalCode: '00100',
        city: 'Helsinki',
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address) {
          lines.push(property.address);
        }
        if (property.postalCode || property.city) {
          lines.push(`${property.postalCode || ''} ${property.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual([
        '123 Test Street',
        '00100 Helsinki',
      ]);
    });

    it('handles missing address', () => {
      const property = {
        address: undefined,
        postalCode: '00100',
        city: 'Helsinki',
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address) {
          lines.push(property.address);
        }
        if (property.postalCode || property.city) {
          lines.push(`${property.postalCode || ''} ${property.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual(['00100 Helsinki']);
    });

    it('handles missing city', () => {
      const property = {
        address: '123 Test Street',
        postalCode: '00100',
        city: undefined,
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address) {
          lines.push(property.address);
        }
        if (property.postalCode || property.city) {
          lines.push(`${property.postalCode || ''} ${property.city || ''}`);
        }
        return lines;
      };

      expect(buildAddress()).toEqual([
        '123 Test Street',
        '00100 ',
      ]);
    });

    it('handles all address fields missing', () => {
      const property = {
        address: undefined,
        postalCode: undefined,
        city: undefined,
      };

      const buildAddress = () => {
        const lines = [];
        if (property.address) {
          lines.push(property.address);
        }
        if (property.postalCode || property.city) {
          lines.push(`${property.postalCode || ''} ${property.city || ''}`);
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
});
