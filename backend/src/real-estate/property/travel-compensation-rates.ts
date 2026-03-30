/**
 * Finnish tax authority travel compensation rates (EUR per km)
 * Source: https://www.vero.fi/
 */
export const TRAVEL_COMPENSATION_RATES: Record<number, number> = {
  2024: 0.30,
  2025: 0.30,
  2026: 0.30,
};

export const DEFAULT_LAUNDRY_PRICE = 3.0;

export function getTravelCompensationRate(year: number): number {
  return TRAVEL_COMPENSATION_RATES[year] ?? TRAVEL_COMPENSATION_RATES[2024] ?? 0.30;
}
