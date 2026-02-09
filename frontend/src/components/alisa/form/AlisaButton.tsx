import { Button, CircularProgress, SxProps, Theme } from "@mui/material";
import { ElementType, ReactNode } from "react";

interface AlisaButtonProps {
  label: string;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
  onClick?: () => void;
  component?: ElementType;
  children?: ReactNode;
}

function AlisaButton({
  label,
  variant = "contained",
  color = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  fullWidth = false,
  type = "button",
  href,
  sx,
  ariaLabel,
  onClick,
  component,
  children,
}: AlisaButtonProps) {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      endIcon={endIcon}
      fullWidth={fullWidth}
      type={type}
      sx={sx}
      aria-label={ariaLabel}
      onClick={onClick}
      {...(href && { href })}
      {...(component && { component })}
    >
      {label}
      {children}
    </Button>
  );
}

export default AlisaButton;
