import { InputAdornment, TextField } from "@mui/material";
import { ChangeEventHandler } from "react";

function AlisaTextField(props: {
  label: string;
  value?: string;
  adornment?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  onChange?:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  onBlur?: () => void;
}) {
  return (
    <TextField
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      type="text"
      label={props.label}
      value={props.value}
      autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
      autoComplete={
        props.autoComplete !== undefined ? props.autoComplete : "off"
      }
      disabled={props.disabled !== undefined ? props.disabled : false}
      multiline={props.multiline}
      rows={props.rows}
      onChange={props.onChange}
      onBlur={props.onBlur}
      InputProps={{
        endAdornment: props.adornment ? (
          <InputAdornment position="end">{props.adornment}</InputAdornment>
        ) : null,
      }}
    />
  );
}

export default AlisaTextField;
