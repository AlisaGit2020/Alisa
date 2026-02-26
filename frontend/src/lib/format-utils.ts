/**
 * Format a number as currency (EUR) using Finnish locale formatting.
 * Returns '-' for undefined/null values.
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a date using Finnish locale formatting.
 * Returns '-' for undefined/null values.
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fi-FI');
};

/**
 * Format a number with a specific number of decimal places.
 * Returns '-' for undefined/null values.
 */
export const formatNumber = (
  value: number | undefined | null,
  decimals: number = 0
): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
