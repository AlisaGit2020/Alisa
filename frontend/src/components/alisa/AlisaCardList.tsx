import * as React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Title from "../../Title";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TFunction } from "i18next";
import AlisaConfirmDialog from "./dialog/AlisaConfirmDialog";
import { TypeOrmFetchOptions } from "../../lib/types";
import ApiClient from "../../lib/api-client";
import AlisaContext from "@alisa-lib/alisa-contexts";
import { VITE_API_URL } from "../../constants";

interface AlisCardListField<T> {
  name: keyof T;
  format?: "number" | "currency" | "date";
}

interface AlisaCardListInputProps<T> {
  t: TFunction;
  title?: string;
  alisaContext: AlisaContext;
  fields: AlisCardListField<T>[];
  fetchOptions?: TypeOrmFetchOptions<T>;
}

function AlisaCardList<T extends { id: number }>({
  t,
  title,
  alisaContext,
  fetchOptions,
}: AlisaCardListInputProps<T>) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);
  const [idDeleted, setIdDeleted] = React.useState<number>(0);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      const data: T[] = await ApiClient.search<T>(
        alisaContext.apiPath,
        fetchOptions,
      );
      setData(data);
    };

    fetchData();
  }, [idDeleted]);

  const handleClickOpen = (apartmentId: number) => {
    setIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await ApiClient.delete(alisaContext.apiPath, idToDelete);
    setIdDeleted(idToDelete);
    handleClose();
  };

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Title>{title}</Title>
      <Link href={"/properties/add"}>{t("add")}</Link>
      {data.length > 0 && (
        <Grid container spacing={2} marginTop={2}>
          {data.map((item: T & { name?: string; size?: number; photo?: string }) => (
            <Grid key={item.name} size={{ md: 4 }}>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {item.name}
                  </Typography>
                  <CardMedia
                    component="img"
                    alt={item.name}
                    height="140"
                    image={item.photo ? `${VITE_API_URL}/${item.photo}` : '/assets/properties/placeholder.svg'}
                  />
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>{t("size")}</TableCell>
                        <TableCell align="right">{item.size} m2</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
                  nec condimentum nisl.
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`edit/${item.id}`)}
                    startIcon={<EditIcon></EditIcon>}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleClickOpen(item.id)}
                    startIcon={<DeleteIcon></DeleteIcon>}
                  >
                    {t("delete")}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {data.length == 0 && (
        <Box padding={2} fontSize={"medium"}>
          {t("noRowsFound")}
        </Box>
      )}

      <AlisaConfirmDialog
        title={t("confirm")}
        contentText={t("confirmDelete")}
        buttonTextConfirm={t("delete")}
        buttonTextCancel={t("cancel")}
        open={open}
        onConfirm={handleDelete}
        onClose={handleClose}
      ></AlisaConfirmDialog>
    </Paper>
  );
}

export default AlisaCardList;
