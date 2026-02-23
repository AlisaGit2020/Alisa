import { InputAdornment, TextField } from "@mui/material";
import { ChangeEventHandler } from "react";

function AssetNumberField(props: {
  label: string;
  value: number | '';
  adornment?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  placeholder?: string;
  width?: string;
  required?: boolean;
  step?: number;
  onChange?:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  onBlur?: () => void;
}) {
  // Shrink label when value is a number (including 0) to prevent label overlap
  const hasValue = typeof props.value === 'number';

  return (
    <TextField
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      type="number"
      label={props.label}
      value={props.value}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
      autoComplete={
        props.autoComplete !== undefined ? props.autoComplete : "off"
      }
      disabled={props.disabled !== undefined ? props.disabled : false}
      required={props.required}
      error={props.error}
      helperText={props.helperText}
      onChange={props.onChange}
      onBlur={props.onBlur}
      onFocus={(e) => e.target.select()}
      slotProps={{
        input: {
          endAdornment: props.adornment ? (
            <InputAdornment position="end">{props.adornment}</InputAdornment>
          ) : null,
        },
        inputLabel: hasValue ? { shrink: true } : undefined,
        htmlInput: props.step !== undefined ? { step: props.step } : undefined,
      }}
    />
  );
}

export default AssetNumberField;
