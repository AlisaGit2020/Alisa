import React, { useState } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface InfoTooltipProps {
  title: string;
  content: string | React.ReactNode;
  variant?: "tooltip" | "dialog";
}

function InfoTooltip({ title, content, variant = "tooltip" }: InfoTooltipProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (variant === "tooltip") {
    const tooltipContent = typeof content === "string" ? content : title;
    return (
      <Tooltip title={tooltipContent} arrow>
        <IconButton size="small" sx={{ p: 0.5 }}>
          <HelpOutlineIcon fontSize="small" color="action" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      <IconButton
        size="small"
        sx={{ p: 0.5 }}
        onClick={() => setDialogOpen(true)}
      >
        <HelpOutlineIcon fontSize="small" color="action" />
      </IconButton>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default InfoTooltip;
