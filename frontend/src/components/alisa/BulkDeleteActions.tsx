import { Box, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import React from "react";
import { TFunction } from "i18next";
import { AlisaCloseIcon } from "./AlisaIcons";
import AlisaButton from "./form/AlisaButton";
import AlisaConfirmDialog from "./dialog/AlisaConfirmDialog";

interface BulkDeleteActionsProps {
  t: TFunction;
  open: boolean;
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function BulkDeleteActions({
  t,
  open,
  selectedCount,
  onCancel,
  onDelete,
  isDeleting = false,
}: BulkDeleteActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDelete();
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <Paper sx={{ padding: 2 }}>
      <Stack direction={"column"} spacing={1}>
        <Box>
          <Typography variant={"body2"}>
            {t("rowsSelected", { count: selectedCount })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <AlisaButton
            label={t("delete")}
            variant="text"
            color="error"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            loading={isDeleting}
            ariaLabel={t("deleteSelectedAriaLabel", {
              count: selectedCount,
            })}
            endIcon={<DeleteIcon />}
          />
          <AlisaButton
            label={t("cancel")}
            variant="text"
            onClick={onCancel}
            disabled={isDeleting}
            endIcon={<AlisaCloseIcon />}
          />
        </Stack>
      </Stack>

      <AlisaConfirmDialog
        title={t("confirm")}
        contentText={t("confirmDeleteSelected", {
          count: selectedCount,
        })}
        buttonTextConfirm={t("delete")}
        buttonTextCancel={t("cancel")}
        open={confirmOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleConfirmClose}
      />
    </Paper>
  );
}

export default BulkDeleteActions;
