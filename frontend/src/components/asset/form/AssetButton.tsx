import { Button, ButtonProps, CircularProgress, Tooltip } from "@mui/material";
import { ElementType, ReactNode } from "react";

interface AssetButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  loading?: boolean;
  ariaLabel?: string;
  component?: ElementType;
  children?: ReactNode;
  tooltip?: string;
}

function AssetButton({
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
  tooltip,
  ...rest
}: AssetButtonProps) {
  const button = (
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
      {...rest}
    >
      {label}
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}

export default AssetButton;
