import { Alert, Snackbar, SnackbarOrigin } from "@mui/material";
import { ReactNode, SyntheticEvent } from "react";

export interface AlisaToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  position?: SnackbarOrigin;
  duration?: number | null;
  action?: ReactNode;
}

function AlisaToast({
  open,
  onClose,
  message,
  severity = "info",
  position = { vertical: "bottom", horizontal: "center" },
  duration = 5000,
  action,
}: AlisaToastProps) {
  const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
    >
      <Alert
        severity={severity}
        onClose={handleClose}
        action={action}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default AlisaToast;
