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
  }, [idDeleted, alisaContext.apiPath, fetchOptions]);

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
      <Link href={`${alisaContext.routePath}/add`}>{t("add")}</Link>
      {data.length > 0 && (
        <Grid container spacing={2} marginTop={2}>
          {data.map((item: T & {
            name?: string;
            size?: number;
            photo?: string;
            description?: string;
            address?: string;
            city?: string;
            postalCode?: string;
            buildYear?: number;
            apartmentType?: string;
            ownerships?: { share: number }[];
          }) => (
            <Grid key={item.name} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  alt={item.name}
                  height="160"
                  image={item.photo ? `${VITE_API_URL}/${item.photo}` : '/assets/properties/placeholder.svg'}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {item.name}
                    {item.apartmentType && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {item.apartmentType}
                      </Typography>
                    )}
                  </Typography>
                  {(item.address || item.city) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.address}
                      {item.address && item.city && ', '}
                      {item.postalCode && `${item.postalCode} `}
                      {item.city}
                    </Typography>
                  )}
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ border: 0, py: 0.5, pl: 0 }}>{t("size")}</TableCell>
                        <TableCell align="right" sx={{ border: 0, py: 0.5, pr: 0 }}>{item.size} m²</TableCell>
                      </TableRow>
                      {item.buildYear && (
                        <TableRow>
                          <TableCell sx={{ border: 0, py: 0.5, pl: 0 }}>{t("buildYear")}</TableCell>
                          <TableCell align="right" sx={{ border: 0, py: 0.5, pr: 0 }}>{item.buildYear}</TableCell>
                        </TableRow>
                      )}
                      {item.ownerships?.[0]?.share !== undefined && item.ownerships[0].share < 100 && (
                        <TableRow>
                          <TableCell sx={{ border: 0, py: 0.5, pl: 0 }}>{t("ownershipShare")}</TableCell>
                          <TableCell align="right" sx={{ border: 0, py: 0.5, pr: 0 }}>{item.ownerships[0].share} %</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: item.description ? 'normal' : 'italic'
                    }}
                  >
                    {item.description || t("noDescription")}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`${alisaContext.routePath}/edit/${item.id}`)}
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
