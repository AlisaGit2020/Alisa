/**
 * Detects if a timezone rollover is needed and returns the corrected date.
 * When UTC hour >= 21, the user's local date is likely the next day.
 *
 * Threshold of 21 covers:
 * - UTC+2 (Finland winter): midnight local = 22:00 UTC
 * - UTC+3 (Finland summer): midnight local = 21:00 UTC
 */
function applyTimezoneRollover(date: Date): Date {
  const hours = date.getUTCHours();
  if (hours >= 21) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

/**
 * Normalizes a date to midnight UTC of the user's intended calendar date.
 *
 * When users enter a date like "01.01.2025", the frontend sends it as
 * a UTC timestamp that may be shifted (e.g., 2024-12-31T22:00:00Z for
 * a user in UTC+2). This function corrects for that by:
 * 1. Checking if the time is close to midnight UTC
 * 2. Rounding to the correct calendar date
 * 3. Setting time to midnight UTC (00:00:00.000Z)
 *
 * @param value - ISO date string, Date object, or undefined
 * @returns Date at midnight UTC of the intended calendar date, or undefined
 */
export function normalizeAccountingDate(
  value: string | Date | undefined,
): Date | undefined {
  if (!value) return undefined;

  const date = new Date(value);

  // Return invalid date as-is so validation can catch it
  if (isNaN(date.getTime())) return date;

  applyTimezoneRollover(date);

  // Set to midnight UTC
  date.setUTCHours(0, 0, 0, 0);

  return date;
}

/**
 * Normalizes a filter start date to midnight UTC of the user's intended date.
 * Used for $gte and $between start date filters.
 *
 * @param value - ISO date string or Date object
 * @returns Date at midnight UTC of the intended calendar date
 */
export function normalizeFilterStartDate(value: string | Date): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) return date;

  applyTimezoneRollover(date);
  date.setUTCHours(0, 0, 0, 0);

  return date;
}

/**
 * Normalizes a filter end date to end of day (23:59:59.999) UTC.
 * Used for $lte and $between end date filters.
 *
 * @param value - ISO date string or Date object
 * @returns Date at end of day UTC of the intended calendar date
 */
export function normalizeFilterEndDate(value: string | Date): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) return date;

  applyTimezoneRollover(date);
  date.setUTCHours(23, 59, 59, 999);

  return date;
}
