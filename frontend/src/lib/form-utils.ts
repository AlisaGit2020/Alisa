import { AxiosError } from 'axios';

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

/**
 * Extracts the validation message(s) from a NestJS-style 4xx response payload
 * (`{ message: string | string[] }`). Returns null for non-axios errors or
 * responses without a message. Multiple messages are joined with `. `.
 */
export function extractValidationMessage(err: unknown): string | null {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const data = axiosErr.response?.data;
  if (!data?.message) return null;
  return Array.isArray(data.message) ? data.message.join('. ') : data.message;
}
