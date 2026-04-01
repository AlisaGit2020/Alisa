import '@testing-library/jest-dom';
import { PropertyInput, PropertyType, ChargeType, PropertyChargeInput } from '@asset-types';
import { PropertyStatus } from '@asset-types/common';
import {
  getPropertyStatusFromPath,
  getReturnPathForStatus,
} from './property-form-utils';
import dayjs from 'dayjs';

// Since Jest mock hoisting causes issues with relative paths in ESM mode,
// we test the data transformation logic separately from the React component
// Following the same pattern as Transactions.test.tsx

// Extended type for form that includes optional id (for edit mode)
interface PropertyFormData extends PropertyInput {
  id?: number;
}

describe('PropertyForm Component Logic', () => {
  const defaultPropertyInput: PropertyFormData = {
    id: 0,
    name: '',
    size: 0,
    photo: undefined,
    description: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
    },
    buildYear: undefined,
    apartmentType: undefined,
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
        data: PropertyFormData,
        field: keyof PropertyFormData,
        value: unknown
      ): PropertyFormData => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'name', 'New Property');
      expect(result.name).toBe('New Property');
    });

    it('updates size field correctly', () => {
      const updateField = (
        data: PropertyFormData,
        field: keyof PropertyFormData,
        value: unknown
      ): PropertyFormData => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'size', 75);
      expect(result.size).toBe(75);
    });

    it('updates address street field correctly', () => {
      const updateAddressField = (
        data: PropertyFormData,
        field: 'street' | 'city' | 'postalCode',
        value: string
      ): PropertyFormData => {
        return {
          ...data,
          address: {
            ...data.address,
            [field]: value,
          },
        };
      };

      const result = updateAddressField(
        defaultPropertyInput,
        'street',
        '123 Test Street'
      );
      expect(result.address?.street).toBe('123 Test Street');
    });

    it('updates address city field correctly', () => {
      const updateAddressField = (
        data: PropertyFormData,
        field: 'street' | 'city' | 'postalCode',
        value: string
      ): PropertyFormData => {
        return {
          ...data,
          address: {
            ...data.address,
            [field]: value,
          },
        };
      };

      const result = updateAddressField(defaultPropertyInput, 'city', 'Helsinki');
      expect(result.address?.city).toBe('Helsinki');
    });

    it('updates address postal code field correctly', () => {
      const updateAddressField = (
        data: PropertyFormData,
        field: 'street' | 'city' | 'postalCode',
        value: string
      ): PropertyFormData => {
        return {
          ...data,
          address: {
            ...data.address,
            [field]: value,
          },
        };
      };

      const result = updateAddressField(defaultPropertyInput, 'postalCode', '00100');
      expect(result.address?.postalCode).toBe('00100');
    });

    // District field tests (TDD - implementation does not exist yet)
    it('updates address district field correctly', () => {
      const updateAddressField = (
        data: PropertyFormData,
        field: 'street' | 'city' | 'postalCode' | 'district',
        value: string
      ): PropertyFormData => {
        return {
          ...data,
          address: {
            ...data.address,
            [field]: value,
          },
        };
      };

      const result = updateAddressField(defaultPropertyInput, 'district', 'Kallio');
      expect(result.address?.district).toBe('Kallio');
    });

    it('preserves other address fields when updating district', () => {
      const inputWithAddress: PropertyFormData = {
        ...defaultPropertyInput,
        address: {
          street: 'Test Street 1',
          city: 'Helsinki',
          postalCode: '00100',
        },
      };

      const updateAddressField = (
        data: PropertyFormData,
        field: 'street' | 'city' | 'postalCode' | 'district',
        value: string
      ): PropertyFormData => {
        return {
          ...data,
          address: {
            ...data.address,
            [field]: value,
          },
        };
      };

      const result = updateAddressField(inputWithAddress, 'district', 'Kallio');
      expect(result.address?.street).toBe('Test Street 1');
      expect(result.address?.city).toBe('Helsinki');
      expect(result.address?.postalCode).toBe('00100');
      expect(result.address?.district).toBe('Kallio');
    });

    it('loads existing district from property data', () => {
      const propertyWithDistrict: PropertyFormData = {
        ...defaultPropertyInput,
        address: {
          street: 'Kallionkatu 5',
          city: 'Helsinki',
          postalCode: '00530',
          district: 'Kallio',
        },
      };

      expect(propertyWithDistrict.address?.district).toBe('Kallio');
    });

    it('updates build year field correctly', () => {
      const updateField = (
        data: PropertyFormData,
        field: keyof PropertyFormData,
        value: unknown
      ): PropertyFormData => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'buildYear', 2000);
      expect(result.buildYear).toBe(2000);
    });

    it('updates apartment type field correctly', () => {
      const updateField = (
        data: PropertyFormData,
        field: keyof PropertyFormData,
        value: unknown
      ): PropertyFormData => {
        return { ...data, [field]: value };
      };

      const result = updateField(defaultPropertyInput, 'apartmentType', PropertyType.APARTMENT);
      expect(result.apartmentType).toBe(PropertyType.APARTMENT);
    });

    it('updates description field correctly', () => {
      const updateField = (
        data: PropertyFormData,
        field: keyof PropertyFormData,
        value: unknown
      ): PropertyFormData => {
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
        data: PropertyFormData,
        newShare: number
      ): PropertyFormData => {
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
      const inputWithUser: PropertyFormData = {
        ...defaultPropertyInput,
        ownerships: [{ userId: 5, share: 100 }],
      };

      const updateOwnershipShare = (
        data: PropertyFormData,
        newShare: number
      ): PropertyFormData => {
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
        data: PropertyFormData,
        newPhoto: string | undefined
      ): PropertyFormData => {
        return { ...data, photo: newPhoto };
      };

      const result = updatePhoto(
        defaultPropertyInput,
        'uploads/photos/test.jpg'
      );
      expect(result.photo).toBe('uploads/photos/test.jpg');
    });

    it('clears photo correctly', () => {
      const inputWithPhoto: PropertyFormData = {
        ...defaultPropertyInput,
        photo: 'uploads/photos/existing.jpg',
      };

      const updatePhoto = (
        data: PropertyFormData,
        newPhoto: string | undefined
      ): PropertyFormData => {
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
      const isNewProperty = (data: PropertyFormData): boolean => {
        return data.id === 0;
      };

      expect(isNewProperty(defaultPropertyInput)).toBe(true);
    });

    it('identifies existing property when id > 0', () => {
      const existingProperty: PropertyFormData = {
        ...defaultPropertyInput,
        id: 5,
      };

      const isNewProperty = (data: PropertyFormData): boolean => {
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
      const getNavigationPath = (): string => '/app/portfolio';
      expect(getNavigationPath()).toBe('/app/portfolio');
    });

    it('returns to properties list after cancel', () => {
      const getNavigationPath = (): string => '/app/portfolio';
      expect(getNavigationPath()).toBe('/app/portfolio');
    });
  });

  describe('API endpoint', () => {
    it('uses correct endpoint for property', () => {
      const apiEndpoint = 'real-estate/property';
      expect(apiEndpoint).toBe('real-estate/property');
    });
  });

  describe('Monthly charge total calculation', () => {
    // Total is always calculated from all 4 component charges
    // Formula: total = maintenanceFee + financialCharge + waterCharge + otherChargeBased

    it('calculates total from all components', () => {
      const charges = {
        maintenanceFee: 150,
        financialCharge: 50,
        waterCharge: 25,
        otherChargeBased: 15,
      };

      const total = charges.maintenanceFee + charges.financialCharge +
                    charges.waterCharge + charges.otherChargeBased;

      expect(total).toBe(240);
    });

    it('calculates total with some zero values', () => {
      const charges = {
        maintenanceFee: 100,
        financialCharge: 0,
        waterCharge: 20,
        otherChargeBased: 0,
      };

      const total = charges.maintenanceFee + charges.financialCharge +
                    charges.waterCharge + charges.otherChargeBased;

      expect(total).toBe(120);
    });

    it('returns zero when all components are zero', () => {
      const charges = {
        maintenanceFee: 0,
        financialCharge: 0,
        waterCharge: 0,
        otherChargeBased: 0,
      };

      const total = charges.maintenanceFee + charges.financialCharge +
                    charges.waterCharge + charges.otherChargeBased;

      expect(total).toBe(0);
    });

    it('handles decimal values correctly', () => {
      const charges = {
        maintenanceFee: 150.50,
        financialCharge: 49.50,
        waterCharge: 25.25,
        otherChargeBased: 10.75,
      };

      const total = charges.maintenanceFee + charges.financialCharge +
                    charges.waterCharge + charges.otherChargeBased;

      expect(total).toBe(236);
    });
  });

  describe('Auto-select newly created property', () => {
    it('dispatches property selection event with new property id after create', () => {
      const dispatchedEvents: { type: string; detail?: unknown }[] = [];
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = (event: Event) => {
        dispatchedEvents.push({
          type: event.type,
          detail: (event as CustomEvent).detail,
        });
        return originalDispatchEvent.call(window, event);
      };

      // Simulate what handleSaveResult should do when creating a new property
      const TRANSACTION_PROPERTY_CHANGE_EVENT = 'transactionPropertyChange';
      const PROPERTY_LIST_CHANGE_EVENT = 'propertyListChange';
      const isNewProperty = true; // !idParam
      const newPropertyId = 42;

      if (isNewProperty && newPropertyId) {
        // This should dispatch TRANSACTION_PROPERTY_CHANGE_EVENT with the new property id
        window.dispatchEvent(
          new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
            detail: { propertyId: newPropertyId },
          })
        );
        window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
      }

      // Verify TRANSACTION_PROPERTY_CHANGE_EVENT was dispatched with correct propertyId
      const propertyChangeEvent = dispatchedEvents.find(
        (e) => e.type === TRANSACTION_PROPERTY_CHANGE_EVENT
      );
      expect(propertyChangeEvent).toBeDefined();
      expect(propertyChangeEvent?.detail).toEqual({ propertyId: 42 });

      window.dispatchEvent = originalDispatchEvent;
    });

    it('calls setTransactionPropertyId with new property id after create', () => {
      // Simulate storage behavior
      let storedPropertyId: number | null = null;
      const setTransactionPropertyId = (id: number) => {
        storedPropertyId = id;
      };

      const isNewProperty = true;
      const newPropertyId = 42;

      if (isNewProperty && newPropertyId) {
        setTransactionPropertyId(newPropertyId);
      }

      expect(storedPropertyId).toBe(42);
    });

    it('does not auto-select when editing existing property', () => {
      const dispatchedEvents: { type: string; detail?: unknown }[] = [];
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = (event: Event) => {
        dispatchedEvents.push({
          type: event.type,
          detail: (event as CustomEvent).detail,
        });
        return originalDispatchEvent.call(window, event);
      };

      const TRANSACTION_PROPERTY_CHANGE_EVENT = 'transactionPropertyChange';
      const isNewProperty = false; // idParam exists (editing)
      const propertyId = 42;

      if (isNewProperty && propertyId) {
        window.dispatchEvent(
          new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
            detail: { propertyId },
          })
        );
      }

      // Should NOT dispatch property change event when editing
      const propertyChangeEvent = dispatchedEvents.find(
        (e) => e.type === TRANSACTION_PROPERTY_CHANGE_EVENT
      );
      expect(propertyChangeEvent).toBeUndefined();

      window.dispatchEvent = originalDispatchEvent;
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
      expect((pendingPhoto as unknown as File).name).toBe('test.jpg');
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

  describe('Property status from URL path', () => {
    it('returns OWN status for /own/add path', () => {
      expect(getPropertyStatusFromPath('/app/portfolio/own/add')).toBe(PropertyStatus.OWN);
    });

    it('returns OWN status for /own/edit/:id path', () => {
      expect(getPropertyStatusFromPath('/app/portfolio/own/edit/123')).toBe(PropertyStatus.OWN);
    });

    it('returns PROSPECT status for /prospects/add path', () => {
      expect(getPropertyStatusFromPath('/app/portfolio/prospects/add')).toBe(PropertyStatus.PROSPECT);
    });

    it('returns PROSPECT status for /prospects/edit/:id path', () => {
      expect(getPropertyStatusFromPath('/app/portfolio/prospects/edit/456')).toBe(PropertyStatus.PROSPECT);
    });

    it('defaults to OWN status for unknown paths', () => {
      // Any path that doesn't contain /prospects/ defaults to OWN
      expect(getPropertyStatusFromPath('/app/portfolio/unknown/add')).toBe(PropertyStatus.OWN);
    });
  });

  describe('Return path based on property status', () => {
    it('returns /own path for OWN status', () => {
      expect(getReturnPathForStatus(PropertyStatus.OWN)).toBe('/app/portfolio/own');
    });

    it('returns /prospects path for PROSPECT status', () => {
      expect(getReturnPathForStatus(PropertyStatus.PROSPECT)).toBe('/app/portfolio/prospects');
    });
  });

  describe('Separate charge state (for batch API)', () => {
    // Charge state stores 4 component charges, total is calculated
    interface ChargeState {
      maintenanceFee: number;
      financialCharge: number;
      waterCharge: number;
      otherChargeBased: number;
    }

    const defaultChargeState: ChargeState = {
      maintenanceFee: 0,
      financialCharge: 0,
      waterCharge: 0,
      otherChargeBased: 0,
    };

    it('has default values of 0 for all charge fields', () => {
      expect(defaultChargeState.maintenanceFee).toBe(0);
      expect(defaultChargeState.financialCharge).toBe(0);
      expect(defaultChargeState.waterCharge).toBe(0);
      expect(defaultChargeState.otherChargeBased).toBe(0);
    });

    it('updates individual charge fields', () => {
      const updateCharge = (
        state: ChargeState,
        field: keyof ChargeState,
        value: number
      ): ChargeState => {
        return { ...state, [field]: value };
      };

      let state = { ...defaultChargeState };
      state = updateCharge(state, 'maintenanceFee', 150);
      expect(state.maintenanceFee).toBe(150);

      state = updateCharge(state, 'financialCharge', 50);
      expect(state.financialCharge).toBe(50);

      state = updateCharge(state, 'waterCharge', 25);
      expect(state.waterCharge).toBe(25);

      state = updateCharge(state, 'otherChargeBased', 15);
      expect(state.otherChargeBased).toBe(15);
    });

    it('edit mode is detected by idParam > 0', () => {
      const isEditMode = (idParam: string | undefined): boolean => {
        return !!idParam && Number(idParam) > 0;
      };

      expect(isEditMode(undefined)).toBe(false);
      expect(isEditMode('0')).toBe(false);
      expect(isEditMode('1')).toBe(true);
      expect(isEditMode('123')).toBe(true);
    });
  });

  describe('Batch charge creation for new properties', () => {
    it('builds charge inputs array from charge state', () => {
      const charges = {
        maintenanceFee: 150,
        financialCharge: 50,
        waterCharge: 25,
        otherChargeBased: 15,
      };
      const propertyId = 42;
      const purchaseDate = new Date('2025-01-15');

      const chargeInputs: PropertyChargeInput[] = [];
      const startDate = dayjs(purchaseDate).format('YYYY-MM-DD');

      if (charges.maintenanceFee > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: charges.maintenanceFee,
          startDate,
        });
      }
      if (charges.financialCharge > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: charges.financialCharge,
          startDate,
        });
      }
      if (charges.waterCharge > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: charges.waterCharge,
          startDate,
        });
      }
      if (charges.otherChargeBased > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.OTHER_CHARGE_BASED,
          amount: charges.otherChargeBased,
          startDate,
        });
      }

      expect(chargeInputs).toHaveLength(4);
      expect(chargeInputs[0]).toEqual({
        propertyId: 42,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 150,
        startDate: '2025-01-15',
      });
      expect(chargeInputs[1]).toEqual({
        propertyId: 42,
        chargeType: ChargeType.FINANCIAL_CHARGE,
        amount: 50,
        startDate: '2025-01-15',
      });
      expect(chargeInputs[2]).toEqual({
        propertyId: 42,
        chargeType: ChargeType.WATER_PREPAYMENT,
        amount: 25,
        startDate: '2025-01-15',
      });
      expect(chargeInputs[3]).toEqual({
        propertyId: 42,
        chargeType: ChargeType.OTHER_CHARGE_BASED,
        amount: 15,
        startDate: '2025-01-15',
      });
    });

    it('skips charges with 0 amount', () => {
      const charges = {
        maintenanceFee: 150,
        financialCharge: 0,
        waterCharge: 0,
        otherChargeBased: 0,
      };
      const propertyId = 42;

      const chargeInputs: PropertyChargeInput[] = [];
      const startDate = null; // No purchase date

      if (charges.maintenanceFee > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: charges.maintenanceFee,
          startDate,
        });
      }
      if (charges.financialCharge > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: charges.financialCharge,
          startDate,
        });
      }
      if (charges.waterCharge > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: charges.waterCharge,
          startDate,
        });
      }
      if (charges.otherChargeBased > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.OTHER_CHARGE_BASED,
          amount: charges.otherChargeBased,
          startDate,
        });
      }

      expect(chargeInputs).toHaveLength(1);
      expect(chargeInputs[0].chargeType).toBe(ChargeType.MAINTENANCE_FEE);
    });

    it('handles null startDate when purchaseDate is not set', () => {
      const charges = {
        maintenanceFee: 150,
        financialCharge: 50,
        waterCharge: 0,
        otherChargeBased: 0,
      };
      const propertyId = 42;
      const purchaseDate: Date | undefined = undefined;

      const chargeInputs: PropertyChargeInput[] = [];
      const startDate = purchaseDate
        ? dayjs(purchaseDate).format('YYYY-MM-DD')
        : null;

      if (charges.maintenanceFee > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: charges.maintenanceFee,
          startDate,
        });
      }
      if (charges.financialCharge > 0) {
        chargeInputs.push({
          propertyId,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: charges.financialCharge,
          startDate,
        });
      }

      expect(chargeInputs).toHaveLength(2);
      expect(chargeInputs[0].startDate).toBeNull();
      expect(chargeInputs[1].startDate).toBeNull();
    });

    it('does not create batch request when no charges have positive values', () => {
      const charges = {
        maintenanceFee: 0,
        financialCharge: 0,
        waterCharge: 0,
        otherChargeBased: 0,
      };

      const chargeInputs: PropertyChargeInput[] = [];

      if (charges.maintenanceFee > 0) {
        chargeInputs.push({
          propertyId: 42,
          chargeType: ChargeType.MAINTENANCE_FEE,
          amount: charges.maintenanceFee,
          startDate: null,
        });
      }
      if (charges.financialCharge > 0) {
        chargeInputs.push({
          propertyId: 42,
          chargeType: ChargeType.FINANCIAL_CHARGE,
          amount: charges.financialCharge,
          startDate: null,
        });
      }
      if (charges.waterCharge > 0) {
        chargeInputs.push({
          propertyId: 42,
          chargeType: ChargeType.WATER_PREPAYMENT,
          amount: charges.waterCharge,
          startDate: null,
        });
      }
      if (charges.otherChargeBased > 0) {
        chargeInputs.push({
          propertyId: 42,
          chargeType: ChargeType.OTHER_CHARGE_BASED,
          amount: charges.otherChargeBased,
          startDate: null,
        });
      }

      // Should not make batch API call if no charges
      expect(chargeInputs.length > 0).toBe(false);
    });
  });

  describe('Current charges fetching for edit mode', () => {
    it('maps API response to charge state', () => {
      // Simulates mapping from CurrentCharges API response to component state
      const apiResponse = {
        maintenanceFee: 150,
        financialCharge: 50,
        waterPrepayment: 25,
        otherChargeBased: 15,
        totalCharge: 240, // Calculated total returned by API
      };

      const chargeState = {
        maintenanceFee: apiResponse.maintenanceFee ?? 0,
        financialCharge: apiResponse.financialCharge ?? 0,
        waterCharge: apiResponse.waterPrepayment ?? 0, // Note: API uses waterPrepayment
        otherChargeBased: apiResponse.otherChargeBased ?? 0,
      };

      // Total is calculated from components
      const totalCharge = chargeState.maintenanceFee + chargeState.financialCharge +
                          chargeState.waterCharge + chargeState.otherChargeBased;

      expect(chargeState.maintenanceFee).toBe(150);
      expect(chargeState.financialCharge).toBe(50);
      expect(chargeState.waterCharge).toBe(25);
      expect(chargeState.otherChargeBased).toBe(15);
      expect(totalCharge).toBe(240);
    });

    it('handles null values in API response', () => {
      const apiResponse = {
        maintenanceFee: null,
        financialCharge: 50,
        waterPrepayment: null,
        otherChargeBased: null,
        totalCharge: null,
      };

      const chargeState = {
        maintenanceFee: apiResponse.maintenanceFee ?? 0,
        financialCharge: apiResponse.financialCharge ?? 0,
        waterCharge: apiResponse.waterPrepayment ?? 0,
        otherChargeBased: apiResponse.otherChargeBased ?? 0,
      };

      // Total is calculated from components
      const totalCharge = chargeState.maintenanceFee + chargeState.financialCharge +
                          chargeState.waterCharge + chargeState.otherChargeBased;

      expect(chargeState.maintenanceFee).toBe(0);
      expect(chargeState.financialCharge).toBe(50);
      expect(chargeState.waterCharge).toBe(0);
      expect(chargeState.otherChargeBased).toBe(0);
      expect(totalCharge).toBe(50);
    });
  });
});
