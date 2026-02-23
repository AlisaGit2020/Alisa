import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@asset-lib/asset-contexts";
import { Box, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AssetCloseIcon } from "../../asset/AssetIcons";
import Typography from "@mui/material/Typography";
import { AssetButton, AssetConfirmDialog } from "../../asset";
import React from "react";

interface TransactionsAcceptedActionsProps extends WithTranslation {
  open: boolean;
  selectedIds: number[];
  onCancel: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function TransactionsAcceptedActions(props: TransactionsAcceptedActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    props.onDelete();
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        padding: 2,
      }}
    >
      <Stack direction={"column"} spacing={1}>
        <Box>
          <Typography variant={"body2"}>
            {props.t("rowsSelected", { count: props.selectedIds.length })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <AssetButton
            label={props.t("delete")}
            variant="text"
            color="error"
            onClick={handleDeleteClick}
            disabled={props.isDeleting}
            loading={props.isDeleting}
            ariaLabel={props.t("deleteAriaLabel", {
              count: props.selectedIds.length,
            })}
            endIcon={<DeleteIcon />}
          />
          <AssetButton
            label={props.t("cancel")}
            variant="text"
            onClick={props.onCancel}
            disabled={props.isDeleting}
            endIcon={<AssetCloseIcon />}
          />
        </Stack>
      </Stack>

      <AssetConfirmDialog
        title={props.t("confirm")}
        contentText={props.t("confirmDeleteTransactions", {
          count: props.selectedIds.length,
        })}
        buttonTextConfirm={props.t("delete")}
        buttonTextCancel={props.t("cancel")}
        open={confirmOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleConfirmClose}
      />
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsAcceptedActions
);
