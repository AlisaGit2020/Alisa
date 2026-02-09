import { Button, CircularProgress } from "@mui/material";
import { ReactNode } from "react";

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
  onClick?: () => void;
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
  onClick,
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
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export default AlisaButton;
