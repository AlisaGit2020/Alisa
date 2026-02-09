import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { DataSaveResult } from "@alisa-types";
import { Box, Button, CircularProgress, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AlisaCloseIcon } from "../../alisa/AlisaIcons";
import Typography from "@mui/material/Typography";
import AlisaDataSaveResult from "../../alisa/AlisaDataSaveResult";
import AlisaConfirmDialog from "../../alisa/dialog/AlisaConfirmDialog";
import React from "react";

interface TransactionsAcceptedActionsProps extends WithTranslation {
  open: boolean;
  selectedIds: number[];
  onCancel: () => void;
  onDelete: () => void;
  saveResult?: DataSaveResult;
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
          <Button
            variant="text"
            color={"error"}
            onClick={handleDeleteClick}
            disabled={props.isDeleting}
            aria-label={props.t("deleteAriaLabel", {
              count: props.selectedIds.length,
            })}
            endIcon={
              props.isDeleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {props.t("delete")}
          </Button>
          <Button
            variant="text"
            onClick={props.onCancel}
            disabled={props.isDeleting}
            endIcon={<AlisaCloseIcon />}
          >
            {props.t("cancel")}
          </Button>
        </Stack>
      </Stack>

      {props.saveResult && (
        <AlisaDataSaveResult
          result={props.saveResult}
          visible={true}
          t={props.t}
        />
      )}

      <AlisaConfirmDialog
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
