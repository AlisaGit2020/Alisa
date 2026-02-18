import ClearIcon from "@mui/icons-material/Clear";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import React, { ChangeEventHandler, ReactNode } from "react";

interface AlisaTextFieldProps {
  label: string;
  value?: string;
  adornment?: string | ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  type?: "text" | "email" | "password" | "url" | "tel";
  onChange?:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  onClear?: () => void;
  onBlur?: () => void;
  sx?: object;
}

function AlisaTextField(props: AlisaTextFieldProps) {
  const showClearButton =
    props.clearable !== false && props.value && !props.disabled;

  const handleClear = () => {
    if (props.onClear) {
      props.onClear();
    } else if (props.onChange) {
      const syntheticEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(syntheticEvent);
    }
  };

  const clearButton = showClearButton ? (
    <IconButton
      size="small"
      onClick={handleClear}
      edge="end"
      aria-label="clear"
      tabIndex={-1}
      sx={{
        padding: 0.25,
        color: "action.disabled",
        "&:hover": { color: "action.active" },
      }}
    >
      <ClearIcon sx={{ fontSize: 16 }} />
    </IconButton>
  ) : null;

  const adornmentContent =
    clearButton || props.adornment ? (
      <InputAdornment
        position="end"
        sx={props.multiline ? { mt: 0 } : undefined}
      >
        {clearButton}
        {typeof props.adornment === "string" ? props.adornment : null}
        {typeof props.adornment !== "string" ? props.adornment : null}
      </InputAdornment>
    ) : null;

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
      error={props.error}
      helperText={props.helperText}
      onChange={props.onChange}
      onBlur={props.onBlur}
      slotProps={{
        input: {
          endAdornment: adornmentContent,
          ...(props.multiline && {
            sx: { alignItems: "flex-start" },
          }),
        },
      }}
    />
  );
}

export default AlisaTextField;
