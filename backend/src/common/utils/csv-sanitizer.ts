/**
 * Sanitizes a CSV field to prevent formula injection attacks.
 *
 * CSV formula injection occurs when a field value starts with characters
 * that spreadsheet applications (Excel, Google Sheets, LibreOffice)
 * interpret as formula indicators: =, +, -, @, tab (\t), or carriage return (\r).
 *
 * When such files are opened in spreadsheet software, malicious formulas
 * can execute arbitrary commands or exfiltrate data.
 *
 * This function prefixes dangerous values with a single quote ('),
 * which forces spreadsheet applications to treat the value as text.
 *
 * @param value - The string value to sanitize
 * @returns The sanitized string safe for CSV storage
 */
export function sanitizeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Check for formula injection patterns at the start of the string
  // Characters that trigger formula interpretation in spreadsheets
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }

  return value;
}
