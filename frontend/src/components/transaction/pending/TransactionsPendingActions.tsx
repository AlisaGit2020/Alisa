import { withTranslation, WithTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts.ts";
import { Box, Button, Paper, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  AlisaApproveIcon,
  AlisaCloseIcon,
  AlisaEditIcon,
} from "../../alisa/AlisaIcons.tsx";
import Typography from "@mui/material/Typography";

interface TransactionsPendingActionsProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  selectedIds: number[];
  onCancel: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  return (
    <Paper
      sx={{
        display: props.open ? "block" : "none",
        marginTop: props.marginTop,
        padding: 2,
      }}
    >
      <Stack direction={"column"} spacing={1}>
        <Box>
          <Typography variant={"body2"}>
            {" "}
            {props.t("rowsSelected", { count: props.selectedIds.length })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant={"text"}
            color={"success"}
            onClick={props.onApprove}
            endIcon={<AlisaApproveIcon></AlisaApproveIcon>}
          >
            {props.t("approve")}
          </Button>
          <Button
            variant="text"
            color={"primary"}
            onClick={props.onEdit}
            endIcon={<AlisaEditIcon></AlisaEditIcon>}
          >
            {props.t("edit")}
          </Button>
          <Button
            variant="text"
            color={"error"}
            onClick={props.onDelete}
            endIcon={<DeleteIcon></DeleteIcon>}
          >
            {props.t("delete")}
          </Button>
          <Button
            variant="text"
            onClick={props.onCancel}
            endIcon={<AlisaCloseIcon></AlisaCloseIcon>}
          >
            {props.t("cancel")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingActions,
);
