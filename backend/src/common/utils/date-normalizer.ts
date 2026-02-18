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
  if (isNaN(date.getTime())) return undefined;

  const hours = date.getUTCHours();

  // If time is 22:00-23:59 UTC, the user's local date is likely the next day
  // (covers timezones up to UTC+2, which includes Finland)
  if (hours >= 22) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  // Set to midnight UTC
  date.setUTCHours(0, 0, 0, 0);

  return date;
}
