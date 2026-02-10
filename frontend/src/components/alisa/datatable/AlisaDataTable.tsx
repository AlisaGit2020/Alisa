import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, Chip, TableContainer, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TFunction } from "i18next";
import AlisaConfirmDialog from "../dialog/AlisaConfirmDialog.tsx";
import { useToast } from "../toast";
import DataService from "@alisa-lib/data-service.ts";
import AlisaDataTableActionButtons, {
  AlisaDataTableAddButton,
} from "./AlisaDataTableActionButtons.tsx";
import AlisaDataTableSelectRow, {
  AlisaDataTableSelectHeaderRow,
} from "./AlisaDataTableSelectRow.tsx";
import {
  TransactionType,
  TransactionTypeName,
  transactionTypeNames,
} from "@alisa-types";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

interface AlisaDataTableField<T> {
  name: keyof T;
  maxLength?: number;
  label?: string;
  format?: "number" | "currency" | "date" | "transactionType" | "translation" | "boolean";
  sum?: boolean;
}

function AlisaDataTable<T extends { id: number }>(props: {
  t: TFunction;
  fields: AlisaDataTableField<T>[];
  dataService?: DataService<T>;
  data?: T[];
  onNewRow?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectChange?: (id: number, item?: T) => void;
  onSelectAllChange?: (ids: number[], items?: T[]) => void;
  selectedIds?: number[];
  onEdit?: (id: number) => void;
  onOpen?: (id: number) => void;
  onDelete?: (id: number) => void;
  refreshTrigger?: number;
}) {
  const [fetchedData, setFetchedData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);
  const [idDeleted, setIdDeleted] = React.useState<number>(0);
  const { showToast } = useToast();

  // Use static data if provided, otherwise fetch from dataService
  const data = props.data ?? fetchedData;

  React.useEffect(() => {
    if (props.dataService) {
      const fetchData = async () => {
        const result: T[] = await props.dataService!.search();
        setFetchedData(result);
      };

      fetchData().then(() => {});
    }
  }, [idDeleted, props.dataService, props.refreshTrigger]);

  const handleDeleteOpen = (apartmentId: number) => {
    setIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleDeleteClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await props.dataService?.delete(idToDelete);
    setTimeout(() => setIdDeleted(idToDelete), 200);
    handleDeleteClose();
    showToast({ message: props.t("toast.deleteSuccess"), severity: "success" });
    if (props.onDelete) {
      props.onDelete(idToDelete);
    }
  };

  const handleSelectAll = () => {
    if (props.onSelectAllChange) {
      if (data.length == props.selectedIds?.length) {
        props.onSelectAllChange([], []);
      } else {
        props.onSelectAllChange(
          data.map((d) => d.id),
          data,
        );
      }
    }
  };

  const calculateSum = (field: AlisaDataTableField<T>): number => {
    if (!field.sum) return 0;
    return data.reduce((acc, item) => {
      const value = item[field.name];
      return acc + (typeof value === "number" ? value : 0);
    }, 0);
  };

  const hasSumFields = props.fields.some((field) => field.sum);

  const getDataValue = (
    field: AlisaDataTableField<T>,
    dataItem: T,
  ): React.ReactNode => {
    let value = dataItem[field.name];

    if (
      field.maxLength &&
      typeof value === "string" &&
      value.length > field.maxLength
    ) {
      value = (value.substring(0, field.maxLength) + "...") as T[keyof T];
    }


    if (field.format == "number") {
      return props.t("format.number", { val: value });
    }
    if (field.format == "currency") {
      return props.t("format.currency.euro", { val: value });
    }
    if (field.format == "translation") {
      return props.t(value as string);
    }
    if (field.format == "transactionType") {
      const typeName = transactionTypeNames.get(
        value as TransactionType,
      ) as TransactionTypeName;

      const getTransactionTypeColor = (type: TransactionType) => {
        switch (type) {
          case TransactionType.INCOME:
            return "success";
          case TransactionType.EXPENSE:
            return "error";
          default:
            return "default";
        }
      };

      return (
        <Chip
          label={props.t(typeName)}
          color={getTransactionTypeColor(value as TransactionType)}
          variant="outlined"
          size="small"
          sx={{ height: 20, fontSize: "0.75rem" }}
        />
      );
    }
    if (field.format == "date") {
      return props.t("format.date", {
        val: new Date(value as string),
        formatParams: {
          val: { year: "numeric", month: "numeric", day: "numeric" },
        },
      });
    }
    if (field.format == "boolean") {
      return value ? (
        <CheckCircleIcon color="success" fontSize="small" />
      ) : null;
    }

    return String(value);
  };

  const sumFields = props.fields.filter((field) => field.sum);

  return (
    <>
      {data.length > 0 && hasSumFields && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1,
            backgroundColor: "action.hover",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {props.t("rowCount", { count: data.length })}
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            {sumFields.map((field) => (
              <Box key={`summary-${field.name as string}`}>
                <Typography variant="body1" component="span" color="text.secondary">
                  {props.t("totalAmount")}:{" "}
                </Typography>
                <Typography variant="body1" component="span" fontWeight="bold">
                  {field.format === "currency"
                    ? props.t("format.currency.euro", { val: calculateSum(field) })
                    : props.t("format.number", { val: calculateSum(field) })}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <TableContainer sx={{ maxHeight: 960 }}>
        <Table stickyHeader size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              {props.onSelectChange && (
                <TableCell>
                  <AlisaDataTableSelectHeaderRow
                    t={props.t}
                    checked={data.length == props.selectedIds?.length}
                    onSelectAll={handleSelectAll}
                    visible={data.length > 0}
                  ></AlisaDataTableSelectHeaderRow>
                </TableCell>
              )}
              {props.fields.map((field) => (
                <TableCell
                  key={field.name as string}
                  align={field.format === "currency" ? "right" : "left"}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <Typography fontWeight={"bold"}>
                    {field.label !== undefined
                      ? field.label
                      : props.t(field.name as string)}
                  </Typography>
                </TableCell>
              ))}
              {props.onNewRow && (
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <AlisaDataTableAddButton
                    onClick={props.onNewRow}
                    t={props.t}
                    visible={
                      props.selectedIds?.length == 0 ||
                      props.selectedIds === undefined
                    }
                  ></AlisaDataTableAddButton>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          {data.length > 0 && (
            <TableBody>
              {data.map((item) => (
                <StyledTableRow key={item.id}>
                  {props.onSelectChange && (
                    <TableCell>
                      <AlisaDataTableSelectRow
                        id={item.id}
                        selectedIds={props.selectedIds || []}
                        onSelect={(id) => props.onSelectChange?.(id, item)}
                      />
                    </TableCell>
                  )}
                  {props.fields.map((field) => (
                    <TableCell
                      key={field.name as string}
                      align={field.format === "currency" ? "right" : "left"}
                      sx={{ whiteSpace: "nowrap", cursor: props.onOpen ? "pointer" : "default" }}
                      onClick={() => props.onOpen?.(item.id)}
                    >
                      {getDataValue(field, item)}
                    </TableCell>
                  ))}

                  {(props.onEdit || props.onDelete || props.onNewRow) && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <AlisaDataTableActionButtons
                        id={item.id}
                        onDelete={props.onDelete ? handleDeleteOpen : undefined}
                        onEdit={props.onEdit}
                        visible={
                          props.selectedIds?.length == 0 ||
                          props.selectedIds === undefined
                        }
                      ></AlisaDataTableActionButtons>
                    </TableCell>
                  )}
                </StyledTableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {data.length == 0 && (
        <Box padding={2} fontSize={"medium"}>
          {props.t("noRowsFound")}
        </Box>
      )}

      <AlisaConfirmDialog
        title={props.t("confirm")}
        contentText={props.t("confirmDelete")}
        buttonTextConfirm={props.t("delete")}
        buttonTextCancel={props.t("cancel")}
        open={open}
        onConfirm={handleDelete}
        onClose={handleDeleteClose}
      ></AlisaConfirmDialog>
    </>
  );
}

export default AlisaDataTable;
