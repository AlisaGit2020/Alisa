import { Box, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import { TFunction } from "i18next";
import { AssetCloseIcon } from "./AssetIcons";
import AssetButton from "./form/AssetButton";

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
          <AssetButton
            label={t("delete")}
            variant="text"
            color="error"
            onClick={onDelete}
            disabled={isDeleting}
            loading={isDeleting}
            ariaLabel={t("deleteSelectedAriaLabel", {
              count: selectedCount,
            })}
            endIcon={<DeleteIcon />}
          />
          <AssetButton
            label={t("cancel")}
            variant="text"
            onClick={onCancel}
            disabled={isDeleting}
            endIcon={<AssetCloseIcon />}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}

export default BulkDeleteActions;
