// Utility for calculating monthly charges
// totalCharge = maintenanceFee + financialCharge
// User can fill any two fields and the third is auto-calculated

export interface ChargeValues {
  maintenanceFee: number | null;
  financialCharge: number | null;
  totalCharge: number | null;  // UI only, not saved to DB
}

export interface ChargeField {
  field: keyof ChargeValues;
  value: number;
}

export type ChargeFieldName = keyof ChargeValues;

/**
 * Calculate the third charge value based on which fields the user has set.
 * Rules:
 * - If user set maintenanceFee + financialCharge → calculate totalCharge
 * - If user set maintenanceFee + totalCharge → calculate financialCharge
 * - If user set financialCharge + totalCharge → calculate maintenanceFee
 *
 * @param values - Current values of all three charge fields
 * @param userSetFields - Set of field names that the user has explicitly set
 * @returns The calculated field and value, or null if not exactly 2 user-set fields
 */
export function calculateCharge(
  values: ChargeValues,
  userSetFields: Set<ChargeFieldName>
): ChargeField | null {
  const { maintenanceFee, financialCharge, totalCharge } = values;

  // Need exactly 2 user-set fields to calculate the third
  if (userSetFields.size !== 2) return null;

  const hasMaintenanceFee = userSetFields.has('maintenanceFee');
  const hasFinancialCharge = userSetFields.has('financialCharge');
  const hasTotalCharge = userSetFields.has('totalCharge');

  const mf = maintenanceFee ?? 0;
  const fc = financialCharge ?? 0;
  const tc = totalCharge ?? 0;

  // Calculate the missing field
  if (hasMaintenanceFee && hasFinancialCharge && !hasTotalCharge) {
    return { field: 'totalCharge', value: mf + fc };
  }
  if (hasMaintenanceFee && hasTotalCharge && !hasFinancialCharge) {
    return { field: 'financialCharge', value: tc - mf };
  }
  if (hasFinancialCharge && hasTotalCharge && !hasMaintenanceFee) {
    return { field: 'maintenanceFee', value: tc - fc };
  }

  return null;
}
