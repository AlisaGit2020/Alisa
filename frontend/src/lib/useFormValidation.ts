import { useState, useCallback } from "react";

// Simple translation function type that works with both real TFunction and test mocks
type TranslationFn = (key: string, params?: Record<string, unknown>) => string;

export interface FieldRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  validDate?: boolean;
}

export interface UseFormValidationResult<T> {
  fieldErrors: Partial<Record<keyof T, string>>;
  validate: (data: T) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}

export function useFormValidation<T extends object>(
  rules: Partial<Record<keyof T, FieldRules>>,
  t: TranslationFn
): UseFormValidationResult<T> {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(
    (data: T): boolean => {
      const errors: Partial<Record<keyof T, string>> = {};

      for (const [field, fieldRules] of Object.entries(rules) as [keyof T, FieldRules][]) {
        if (!fieldRules) continue;

        const value = data[field];

        // Required check
        if (fieldRules.required) {
          if (value === undefined || value === null || value === "") {
            errors[field] = t("common:validation.required");
            continue;
          }
        }

        // Skip other validations if value is empty and not required
        if (value === undefined || value === null || value === "") {
          continue;
        }

        // Min check (for numbers)
        if (fieldRules.min !== undefined && typeof value === "number") {
          if (value < fieldRules.min) {
            errors[field] = t("common:validation.min", { min: fieldRules.min });
            continue;
          }
        }

        // Max check (for numbers)
        if (fieldRules.max !== undefined && typeof value === "number") {
          if (value > fieldRules.max) {
            errors[field] = t("common:validation.max", { max: fieldRules.max });
            continue;
          }
        }

        // MinLength check (for strings)
        if (fieldRules.minLength !== undefined && typeof value === "string") {
          if (value.length < fieldRules.minLength) {
            errors[field] = t("common:validation.minLength", { min: fieldRules.minLength });
            continue;
          }
        }

        // MaxLength check (for strings)
        if (fieldRules.maxLength !== undefined && typeof value === "string") {
          if (value.length > fieldRules.maxLength) {
            errors[field] = t("common:validation.maxLength", { max: fieldRules.maxLength });
            continue;
          }
        }

        // Valid date check
        if (fieldRules.validDate && value instanceof Date) {
          if (isNaN(value.getTime())) {
            errors[field] = t("common:validation.invalidDate");
            continue;
          }
        }
      }

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [rules, t]
  );

  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { fieldErrors, validate, clearErrors, clearFieldError };
}
