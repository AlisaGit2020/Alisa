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
import { DataSaveResultDto } from "@alisa-backend/common/dtos/data-save-result.dto.ts";
import AlisaDataSaveResult from "../../alisa/AlisaDataSaveResult.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";
import React from "react";

interface TransactionsPendingActionsProps extends WithTranslation {
  marginTop?: number;
  open: boolean;
  selectedIds: number[];
  onCancel: () => void;
  onApprove: () => void;
  onSetType: (type: number) => void;
  onDelete: () => void;
  saveResult?: DataSaveResultDto;
}

function TransactionsPendingActions(props: TransactionsPendingActionsProps) {
  const [editState, setEditState] = React.useState<boolean>(false);
  const [transactionType, setTransactionType] = React.useState<number>(0);

  const handleEdit = () => {
    if (editState) {
      props.onSetType(transactionType);
      setEditState(false);
    } else {
      setEditState(true);
    }
  };

  const handleCancel = () => {
    if (editState) {
      setEditState(false);
    } else {
      props.onCancel();
    }
  };

  const handleTypeChange = (type: number) => {
    setTransactionType(type);
  };

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

        <Stack
          direction="row"
          spacing={2}
          sx={{ display: !editState ? "flex" : "none" }}
        >
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
            onClick={handleEdit}
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
            onClick={() => handleCancel()}
            endIcon={<AlisaCloseIcon></AlisaCloseIcon>}
          >
            {props.t("cancel")}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{ display: editState ? "flex" : "none" }}
        >
          <Button
            variant="text"
            color={"success"}
            onClick={handleEdit}
            endIcon={<AlisaApproveIcon></AlisaApproveIcon>}
          >
            {props.t("save")}
          </Button>

          <Button
            variant="text"
            onClick={() => handleCancel()}
            endIcon={<AlisaCloseIcon></AlisaCloseIcon>}
          >
            {props.t("cancel")}
          </Button>
        </Stack>

        <AlisaTransactionTypeSelect
          onSelect={handleTypeChange}
          selectedValue={transactionType}
          t={props.t}
          variant={"split-button"}
          direction={"row"}
          showLabel={true}
          visible={editState}
        ></AlisaTransactionTypeSelect>
      </Stack>
      <AlisaDataSaveResult
        result={props.saveResult as DataSaveResultDto}
        visible={props.saveResult !== undefined && !editState}
        t={props.t}
      ></AlisaDataSaveResult>
    </Paper>
  );
}

export default withTranslation(transactionContext.name)(
  TransactionsPendingActions,
);
