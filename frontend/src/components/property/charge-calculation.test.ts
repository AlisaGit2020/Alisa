import { calculateCharge, ChargeValues, ChargeFieldName } from './charge-calculation';

describe('calculateCharge', () => {
  describe('when maintenanceFee and financialCharge are set', () => {
    it('calculates totalCharge', () => {
      const values: ChargeValues = {
        maintenanceFee: 150,
        financialCharge: 50,
        totalCharge: 0,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee', 'financialCharge']);

      const result = calculateCharge(values, userSetFields);

      expect(result).toEqual({ field: 'totalCharge', value: 200 });
    });
  });

  describe('when totalCharge and maintenanceFee are set', () => {
    it('calculates financialCharge', () => {
      const values: ChargeValues = {
        maintenanceFee: 150,
        financialCharge: 0,
        totalCharge: 200,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee', 'totalCharge']);

      const result = calculateCharge(values, userSetFields);

      expect(result).toEqual({ field: 'financialCharge', value: 50 });
    });
  });

  describe('when totalCharge and financialCharge are set', () => {
    it('calculates maintenanceFee', () => {
      const values: ChargeValues = {
        maintenanceFee: 0,
        financialCharge: 50,
        totalCharge: 200,
      };
      const userSetFields = new Set<ChargeFieldName>(['financialCharge', 'totalCharge']);

      const result = calculateCharge(values, userSetFields);

      expect(result).toEqual({ field: 'maintenanceFee', value: 150 });
    });
  });

  describe('edge cases', () => {
    it('returns null when only one field is set', () => {
      const values: ChargeValues = {
        maintenanceFee: 150,
        financialCharge: 0,
        totalCharge: 0,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee']);

      expect(calculateCharge(values, userSetFields)).toBeNull();
    });

    it('returns null when all three fields are set', () => {
      const values: ChargeValues = {
        maintenanceFee: 150,
        financialCharge: 50,
        totalCharge: 200,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee', 'financialCharge', 'totalCharge']);

      expect(calculateCharge(values, userSetFields)).toBeNull();
    });

    it('returns null when no fields are set', () => {
      const values: ChargeValues = {
        maintenanceFee: 0,
        financialCharge: 0,
        totalCharge: 0,
      };
      const userSetFields = new Set<ChargeFieldName>();

      expect(calculateCharge(values, userSetFields)).toBeNull();
    });

    it('handles decimal values correctly', () => {
      const values: ChargeValues = {
        maintenanceFee: 150.50,
        financialCharge: 49.50,
        totalCharge: 0,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee', 'financialCharge']);

      expect(calculateCharge(values, userSetFields)).toEqual({ field: 'totalCharge', value: 200 });
    });

    it('handles negative result when totalCharge is less than maintenanceFee', () => {
      const values: ChargeValues = {
        maintenanceFee: 200,
        financialCharge: 0,
        totalCharge: 150,
      };
      const userSetFields = new Set<ChargeFieldName>(['maintenanceFee', 'totalCharge']);

      expect(calculateCharge(values, userSetFields)).toEqual({ field: 'financialCharge', value: -50 });
    });
  });
});
