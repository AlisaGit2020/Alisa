import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, CircularProgress, IconButton, TextField } from "@mui/material";
import React, { ChangeEventHandler } from "react";

interface AlisaTextButtonProps {
  label: string;
  buttonLabel: string;
  value?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onClear?: () => void;
  onButtonClick?: () => void;
  sx?: object;
}

function AlisaTextButton({
  label,
  buttonLabel,
  value = "",
  placeholder,
  clearable = true,
  disabled = false,
  loading = false,
  error = false,
  helperText,
  fullWidth = true,
  onChange,
  onClear,
  onButtonClick,
  sx,
}: AlisaTextButtonProps) {
  const isButtonDisabled = disabled || loading || !value.trim();
  const showClearButton = clearable && value && !disabled;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      onChange={onChange}
      autoComplete="off"
      sx={sx}
      slotProps={{
        input: {
          endAdornment: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {showClearButton && (
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
              )}
              <Button
                variant="contained"
                size="small"
                disabled={isButtonDisabled}
                onClick={onButtonClick}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SearchIcon sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  minWidth: "auto",
                  whiteSpace: "nowrap",
                  ml: 0.5,
                }}
              >
                {buttonLabel}
              </Button>
            </Box>
          ),
        },
      }}
    />
  );
}

export default AlisaTextButton;
