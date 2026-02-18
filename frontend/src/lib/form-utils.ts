/**
 * Creates error props for form fields from a field errors object.
 * @param fieldErrors - Object mapping field names to error messages
 * @param field - The field name to get error props for
 * @returns Object with `error` boolean and `helperText` string for MUI components
 */
export function getFieldErrorProps<T extends object>(
  fieldErrors: Partial<Record<keyof T, string>>,
  field: keyof T
): { error: boolean; helperText: string | undefined } {
  return {
    error: !!fieldErrors[field],
    helperText: fieldErrors[field],
  };
}
