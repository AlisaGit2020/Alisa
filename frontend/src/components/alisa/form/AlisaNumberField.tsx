import { InputAdornment, TextField } from "@mui/material";
import { ChangeEventHandler } from "react";

function AlisaNumberField(props: {
  label: string;
  value: number;
  adornment?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  width?: string;
  required?: boolean;
  step?: number;
  onChange?:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  onBlur?: () => void;
}) {
  return (
    <TextField
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      type="number"
      label={props.label}
      value={props.value}
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
        htmlInput: props.step !== undefined ? { step: props.step } : undefined,
      }}
    />
  );
}

export default AlisaNumberField;
