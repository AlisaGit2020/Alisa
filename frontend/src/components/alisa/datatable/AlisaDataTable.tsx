import * as React from "react";
import { styled } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, TableContainer, Typography } from "@mui/material";
import { TFunction } from "i18next";
import AlisaConfirmDialog from "../dialog/AlisaConfirmDialog.tsx";
import DataService from "@alisa-lib/data-service.ts";
import AlisaDataTableActionButtons, {
  AlisaDataTableAddButton,
} from "./AlisaDataTableActionButtons.tsx";
import AlisaDataTableSelectRow, {
  AlisaDataTableSelectHeaderRow,
} from "./AlisaDataTableSelectRow.tsx";

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
  format?: "number" | "currency" | "date";
}

function AlisaDataTable<T extends { id: number }>(props: {
  t: TFunction;
  fields: AlisaDataTableField<T>[];
  dataService: DataService<T>;
  onNewRow: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectChange?: (id: number) => void;
  onSelectAllChange?: (ids: number[]) => void;
  selectedIds?: number[];
  onEdit?: (id: number) => void;
  onOpen: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);
  const [idDeleted, setIdDeleted] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchData = async () => {
      const data: T[] = await props.dataService.search();
      setData(data);
    };

    fetchData().then(() => {});
  }, [idDeleted, props.dataService]);

  const handleDeleteOpen = (apartmentId: number) => {
    setIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleDeleteClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await props.dataService.delete(idToDelete);
    setTimeout(() => setIdDeleted(idToDelete), 200);
    handleDeleteClose();
    if (props.onDelete) {
      props.onDelete(idToDelete);
    }
  };

  const handleSelectAll = () => {
    if (props.onSelectAllChange) {
      if (data.length == props.selectedIds?.length) {
        props.onSelectAllChange([]);
      } else {
        props.onSelectAllChange(data.map((d) => d.id));
      }
    }
  };

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

    if (typeof value === "boolean") {
      return <CheckIcon visibility={value ? "visible" : "hidden"}></CheckIcon>;
    }
    if (field.format == "number") {
      return props.t("format.number", { val: value });
    }
    if (field.format == "currency") {
      return props.t("format.currency.euro", { val: value });
    }
    if (field.format == "date") {
      return props.t("format.date", {
        val: new Date(value as string),
        formatParams: {
          val: { year: "numeric", month: "numeric", day: "numeric" },
        },
      });
    }

    return String(value);
  };

  return (
    <>
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
                  ></AlisaDataTableSelectHeaderRow>
                </TableCell>
              )}
              {props.fields.map((field) => (
                <TableCell
                  key={field.name as string}
                  align={field.format === "currency" ? "right" : "left"}
                >
                  <Typography fontWeight={"bold"}>
                    {props.t(field.name as string)}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="right">
                <AlisaDataTableAddButton
                  onClick={props.onNewRow}
                  t={props.t}
                  visible={
                    props.selectedIds?.length == 0 ||
                    props.selectedIds === undefined
                  }
                ></AlisaDataTableAddButton>
              </TableCell>
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
                        onSelect={props.onSelectChange}
                      />
                    </TableCell>
                  )}
                  {props.fields.map((field) => (
                    <TableCell
                      key={field.name as string}
                      align={field.format === "currency" ? "right" : "left"}
                      onClick={() => props.onOpen(item.id)}
                    >
                      {getDataValue(field, item)}
                    </TableCell>
                  ))}

                  <TableCell align="right">
                    <AlisaDataTableActionButtons
                      id={item.id}
                      onDelete={handleDeleteOpen}
                      onEdit={props.onEdit}
                      visible={
                        props.selectedIds?.length == 0 ||
                        props.selectedIds === undefined
                      }
                    ></AlisaDataTableActionButtons>
                  </TableCell>
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
