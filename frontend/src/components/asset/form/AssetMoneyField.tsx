import { InputAdornment, TextField } from "@mui/material";
import { ChangeEvent, useState } from "react";

/**
 * Parses a money value string, converting comma to period and rounding to 2 decimals.
 * Returns undefined for empty/invalid input, preserves 0 as valid value.
 */
export function parseMoneyValue(value: string): number | undefined {
  // Convert comma to period for European decimal input
  const normalized = value.replace(",", ".");
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return undefined;
  }

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    return undefined;
  }

  // Round to 2 decimal places for money
  return parseFloat(parsed.toFixed(2));
}

/**
 * Checks if a string is a valid intermediate money input (allows trailing decimal).
 * Examples: "123", "123.", "123.4", "123,", "123,45", "-", "-123."
 */
function isValidMoneyInput(value: string): boolean {
  // Allow empty
  if (value === "") return true;
  // Allow just minus sign (starting negative number)
  if (value === "-") return true;
  // Pattern: optional minus, digits, optional decimal separator, optional decimal digits
  const pattern = /^-?\d*[.,]?\d{0,2}$/;
  return pattern.test(value);
}

function AssetMoneyField(props: {
  label: string;
  value: number | "";
  adornment?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (value: number | undefined) => void;
  onBlur?: () => void;
}) {
  // Local state for the text input to allow intermediate states like "123." or "123,"
  const [inputValue, setInputValue] = useState<string>(
    typeof props.value === "number" ? String(props.value) : ""
  );

  // Track the last synced external value to detect external changes
  const [lastExternalValue, setLastExternalValue] = useState(props.value);

  // Derive the display value: use local input, but sync when external value changes
  const externalValue = typeof props.value === "number" ? String(props.value) : "";
  const displayValue = props.value !== lastExternalValue ? externalValue : inputValue;

  // Update tracking when external value changes
  if (props.value !== lastExternalValue) {
    setLastExternalValue(props.value);
    setInputValue(externalValue);
  }

  // Shrink label when there's any input
  const hasValue = displayValue !== "" || typeof props.value === "number";

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Only allow valid money input patterns
    if (!isValidMoneyInput(newValue)) {
      return;
    }

    setInputValue(newValue);

    // Notify parent with parsed value (may be undefined for intermediate states)
    if (props.onChange) {
      props.onChange(parseMoneyValue(newValue));
    }
  };

  const handleBlur = () => {
    // On blur, normalize the display value (remove trailing decimal, format properly)
    const parsed = parseMoneyValue(inputValue);
    if (parsed !== undefined) {
      setInputValue(String(parsed));
    } else if (inputValue !== "") {
      // Invalid input, reset to empty or previous value
      setInputValue(typeof props.value === "number" ? String(props.value) : "");
    }

    props.onBlur?.();
  };

  return (
    <TextField
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      type="text"
      label={props.label}
      value={inputValue}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
      autoComplete="off"
      disabled={props.disabled !== undefined ? props.disabled : false}
      required={props.required}
      error={props.error}
      helperText={props.helperText}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
      slotProps={{
        input: {
          readOnly: props.readOnly,
          endAdornment: (
            <InputAdornment position="end">
              {props.adornment ?? "€"}
            </InputAdornment>
          ),
        },
        inputLabel: hasValue ? { shrink: true } : undefined,
        htmlInput: { inputMode: "decimal" },
      }}
    />
  );
}

export default AssetMoneyField;
