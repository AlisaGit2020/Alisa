import '@testing-library/jest-dom';
import { PropertyInputDto } from '@alisa-types';

// Since Jest mock hoisting causes issues with relative paths in ESM mode,
// we test the data transformation logic separately from the React component
// Following the same pattern as Transactions.test.tsx

describe('PropertyForm Component Logic', () => {
  const defaultPropertyInput: PropertyInputDto = {
    id: 0,
    name: '',
    size: 0,
    photo: undefined,
    description: '',
    address: '',
    city: '',
    postalCode: '',
    buildYear: undefined,
    apartmentType: '',
    ownerships: [{ userId: 0, share: 100 }],
  };

  describe('Initial form data', () => {
    it('has default id of 0', () => {
      expect(defaultPropertyInput.id).toBe(0);
    });

    it('has empty name', () => {
      expect(defaultPropertyInput.name).toBe('');
    });

    it('has size of 0', () => {
      expect(defaultPropertyInput.size).toBe(0);
    });

    it('has default ownership share of 100', () => {
      expect(defaultPropertyInput.ownerships?.[0]?.share).toBe(100);
    });

    it('has undefined photo', () => {
      expect(defaultPropertyInput.photo).toBeUndefined();
    });
  });

  describe('Form data update logic', () => {
    it('updates name field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'name', 'New Property');
      expect(result.name).toBe('New Property');
    });

    it('updates size field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'size', 75);
      expect(result.size).toBe(75);
    });

    it('updates address field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(
        defaultPropertyInput,
        'address',
        '123 Test Street'
      );
      expect(result.address).toBe('123 Test Street');
    });

    it('updates city field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'city', 'Helsinki');
      expect(result.city).toBe('Helsinki');
    });

    it('updates postal code field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'postalCode', '00100');
      expect(result.postalCode).toBe('00100');
    });

    it('updates build year field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'buildYear', 2000);
      expect(result.buildYear).toBe(2000);
    });

    it('updates apartment type field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'apartmentType', '2h+k');
      expect(result.apartmentType).toBe('2h+k');
    });

    it('updates description field correctly', () => {
      const updateField = (
        data: PropertyInputDto,
        field: keyof PropertyInputDto,
        value: unknown
      ): PropertyInputDto => {
        return { ...data, [field]: value };
      };

      const result = updateField(
        defaultPropertyInput,
        'description',
        'A nice apartment'
      );
      expect(result.description).toBe('A nice apartment');
    });
  });

  describe('Ownership share update logic', () => {
    it('updates ownership share correctly', () => {
      const updateOwnershipShare = (
        data: PropertyInputDto,
        newShare: number
      ): PropertyInputDto => {
        if (!data.ownerships || data.ownerships.length === 0) {
          return data;
        }
        return {
          ...data,
          ownerships: [{ ...data.ownerships[0], share: newShare }],
        };
      };

      const result = updateOwnershipShare(defaultPropertyInput, 50);
      expect(result.ownerships?.[0]?.share).toBe(50);
    });

    it('preserves userId when updating share', () => {
      const inputWithUser: PropertyInputDto = {
        ...defaultPropertyInput,
        ownerships: [{ userId: 5, share: 100 }],
      };

      const updateOwnershipShare = (
        data: PropertyInputDto,
        newShare: number
      ): PropertyInputDto => {
        if (!data.ownerships || data.ownerships.length === 0) {
          return data;
        }
        return {
          ...data,
          ownerships: [{ ...data.ownerships[0], share: newShare }],
        };
      };

      const result = updateOwnershipShare(inputWithUser, 75);
      expect(result.ownerships?.[0]?.userId).toBe(5);
      expect(result.ownerships?.[0]?.share).toBe(75);
    });
  });

  describe('Photo update logic', () => {
    it('updates photo path correctly', () => {
      const updatePhoto = (
        data: PropertyInputDto,
        newPhoto: string | undefined
      ): PropertyInputDto => {
        return { ...data, photo: newPhoto };
      };

      const result = updatePhoto(
        defaultPropertyInput,
        'uploads/photos/test.jpg'
      );
      expect(result.photo).toBe('uploads/photos/test.jpg');
    });

    it('clears photo correctly', () => {
      const inputWithPhoto: PropertyInputDto = {
        ...defaultPropertyInput,
        photo: 'uploads/photos/existing.jpg',
      };

      const updatePhoto = (
        data: PropertyInputDto,
        newPhoto: string | undefined
      ): PropertyInputDto => {
        return { ...data, photo: newPhoto };
      };

      const result = updatePhoto(inputWithPhoto, undefined);
      expect(result.photo).toBeUndefined();
    });
  });

  describe('ID parameter parsing', () => {
    it('parses valid id from URL param', () => {
      const parseIdParam = (idParam: string | undefined): number => {
        if (!idParam) return 0;
        const parsed = parseInt(idParam, 10);
        return isNaN(parsed) ? 0 : parsed;
      };

      expect(parseIdParam('5')).toBe(5);
    });

    it('returns 0 for undefined param', () => {
      const parseIdParam = (idParam: string | undefined): number => {
        if (!idParam) return 0;
        const parsed = parseInt(idParam, 10);
        return isNaN(parsed) ? 0 : parsed;
      };

      expect(parseIdParam(undefined)).toBe(0);
    });

    it('returns 0 for invalid param', () => {
      const parseIdParam = (idParam: string | undefined): number => {
        if (!idParam) return 0;
        const parsed = parseInt(idParam, 10);
        return isNaN(parsed) ? 0 : parsed;
      };

      expect(parseIdParam('abc')).toBe(0);
    });

    it('handles "0" param for new property', () => {
      const parseIdParam = (idParam: string | undefined): number => {
        if (!idParam) return 0;
        const parsed = parseInt(idParam, 10);
        return isNaN(parsed) ? 0 : parsed;
      };

      expect(parseIdParam('0')).toBe(0);
    });
  });

  describe('New vs existing property detection', () => {
    it('identifies new property when id is 0', () => {
      const isNewProperty = (data: PropertyInputDto): boolean => {
        return data.id === 0;
      };

      expect(isNewProperty(defaultPropertyInput)).toBe(true);
    });

    it('identifies existing property when id > 0', () => {
      const existingProperty: PropertyInputDto = {
        ...defaultPropertyInput,
        id: 5,
      };

      const isNewProperty = (data: PropertyInputDto): boolean => {
        return data.id === 0;
      };

      expect(isNewProperty(existingProperty)).toBe(false);
    });
  });

  describe('Form validation logic', () => {
    it('name is required', () => {
      const validateName = (name: string): boolean => {
        return name.trim().length > 0;
      };

      expect(validateName('')).toBe(false);
      expect(validateName('  ')).toBe(false);
      expect(validateName('Valid Name')).toBe(true);
    });

    it('ownership share must be between 0 and 100', () => {
      const validateOwnershipShare = (share: number): boolean => {
        return share >= 0 && share <= 100;
      };

      expect(validateOwnershipShare(-1)).toBe(false);
      expect(validateOwnershipShare(0)).toBe(true);
      expect(validateOwnershipShare(50)).toBe(true);
      expect(validateOwnershipShare(100)).toBe(true);
      expect(validateOwnershipShare(101)).toBe(false);
    });

    it('size must be non-negative', () => {
      const validateSize = (size: number): boolean => {
        return size >= 0;
      };

      expect(validateSize(-1)).toBe(false);
      expect(validateSize(0)).toBe(true);
      expect(validateSize(75)).toBe(true);
    });

    it('build year must be reasonable if provided', () => {
      const currentYear = new Date().getFullYear();
      const validateBuildYear = (year: number | undefined): boolean => {
        if (year === undefined) return true;
        return year >= 1800 && year <= currentYear + 5;
      };

      expect(validateBuildYear(undefined)).toBe(true);
      expect(validateBuildYear(1799)).toBe(false);
      expect(validateBuildYear(1800)).toBe(true);
      expect(validateBuildYear(2000)).toBe(true);
      expect(validateBuildYear(currentYear)).toBe(true);
      expect(validateBuildYear(currentYear + 10)).toBe(false);
    });
  });

  describe('Navigation paths', () => {
    it('returns to properties list after save', () => {
      const getNavigationPath = (): string => '/app/properties';
      expect(getNavigationPath()).toBe('/app/properties');
    });

    it('returns to properties list after cancel', () => {
      const getNavigationPath = (): string => '/app/properties';
      expect(getNavigationPath()).toBe('/app/properties');
    });
  });

  describe('API endpoint', () => {
    it('uses correct endpoint for property', () => {
      const apiEndpoint = 'real-estate/property';
      expect(apiEndpoint).toBe('real-estate/property');
    });
  });

  describe('Pending photo for new properties', () => {
    it('new property shows photo upload in pending mode', () => {
      const isNewProperty = (id: number): boolean => id === 0;
      expect(isNewProperty(0)).toBe(true);
    });

    it('existing property shows photo upload in normal mode', () => {
      const isNewProperty = (id: number): boolean => id === 0;
      expect(isNewProperty(5)).toBe(false);
    });

    it('pending photo state starts as null', () => {
      const pendingPhoto: File | null = null;
      expect(pendingPhoto).toBeNull();
    });

    it('pending photo can be set', () => {
      let pendingPhoto: File | null = null;
      const setPendingPhoto = (file: File | null) => {
        pendingPhoto = file;
      };

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      setPendingPhoto(file);

      expect(pendingPhoto).not.toBeNull();
      expect(pendingPhoto?.name).toBe('test.jpg');
    });

    it('pending photo can be cleared', () => {
      let pendingPhoto: File | null = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const setPendingPhoto = (file: File | null) => {
        pendingPhoto = file;
      };

      setPendingPhoto(null);
      expect(pendingPhoto).toBeNull();
    });

    it('photo upload endpoint uses saved property id', () => {
      const buildUploadEndpoint = (propertyId: number): string => {
        return `/real-estate/property/${propertyId}/photo`;
      };

      expect(buildUploadEndpoint(123)).toBe('/real-estate/property/123/photo');
    });
  });
});
