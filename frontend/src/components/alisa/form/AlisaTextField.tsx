import { InputAdornment, TextField } from "@mui/material";
import { ChangeEventHandler, ReactNode } from "react";

interface AlisaTextFieldProps {
  label: string;
  value?: string;
  adornment?: string | ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  type?: "text" | "email" | "password" | "url" | "tel";
  onChange?:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  onBlur?: () => void;
  sx?: object;
}

function AlisaTextField(props: AlisaTextFieldProps) {
  const adornmentContent = props.adornment
    ? typeof props.adornment === "string"
      ? <InputAdornment position="end">{props.adornment}</InputAdornment>
      : props.adornment
    : null;

  return (
    <TextField
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      type={props.type ?? "text"}
      label={props.label}
      value={props.value}
      placeholder={props.placeholder}
      sx={props.sx}
      autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
      autoComplete={
        props.autoComplete !== undefined ? props.autoComplete : "off"
      }
      disabled={props.disabled !== undefined ? props.disabled : false}
      multiline={props.multiline}
      rows={props.rows}
      required={props.required}
      onChange={props.onChange}
      onBlur={props.onBlur}
      slotProps={{
        input: {
          endAdornment: adornmentContent,
        },
      }}
    />
  );
}

export default AlisaTextField;
