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
  CardActionArea,
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
import AssetConfirmDialog from "./dialog/AssetConfirmDialog";
import AssetDependencyDialog from "./dialog/AssetDependencyDialog";
import { useToast } from "./toast";
import { TypeOrmFetchOptions } from "../../lib/types";
import ApiClient from "../../lib/api-client";
import AssetContext from "@asset-lib/asset-contexts";
import { VITE_BASE_URL } from "../../constants";
import { Address, DeleteValidationResult } from "@asset-types";

interface AlisCardListField<T> {
  name: keyof T;
  format?: "number" | "currency" | "date";
}

interface AssetCardListInputProps<T> {
  t: TFunction;
  title?: string;
  assetContext: AssetContext;
  fields: AlisCardListField<T>[];
  fetchOptions?: TypeOrmFetchOptions<T>;
  onAfterDelete?: () => void;
}

function AssetCardList<T extends { id: number }>({
  t,
  title,
  assetContext,
  fetchOptions,
  onAfterDelete,
}: AssetCardListInputProps<T>) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);
  const [idDeleted, setIdDeleted] = React.useState<number>(0);
  const [dependencyDialogOpen, setDependencyDialogOpen] = React.useState(false);
  const [validationResult, setValidationResult] =
    React.useState<DeleteValidationResult | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number>(0);
  const navigate = useNavigate();
  const { showToast } = useToast();

  React.useEffect(() => {
    const fetchData = async () => {
      const data: T[] = await ApiClient.search<T>(
        assetContext.apiPath,
        fetchOptions,
      );
      setData(data);
    };

    fetchData();
  }, [idDeleted, assetContext.apiPath, fetchOptions]);

  const handleClickOpen = async (apartmentId: number) => {
    setIdToDelete(apartmentId);

    // Pre-fetch dependencies to show in confirmation
    try {
      const validation = await ApiClient.fetch<DeleteValidationResult>(
        `${assetContext.apiPath}/${apartmentId}/can-delete`
      );

      if (validation.dependencies && validation.dependencies.length > 0) {
        setValidationResult(validation);
        setPendingDeleteId(apartmentId);
        setDependencyDialogOpen(true);
      } else {
        // No dependencies, show simple confirm
        setOpen(true);
      }
    } catch {
      // Fallback to simple confirm if check fails
      setOpen(true);
    }
  };

  const handleClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      await ApiClient.delete(assetContext.apiPath, idToDelete);
      setIdDeleted(idToDelete);
      handleClose();
      showToast({ message: t("toast.deleteSuccess"), severity: "success" });
      onAfterDelete?.();
    } catch {
      handleClose();
      showToast({ message: t("toast.deleteError"), severity: "error" });
    }
  };

  const handleConfirmDeleteWithDependencies = async () => {
    try {
      await ApiClient.delete(assetContext.apiPath, pendingDeleteId);
      setIdDeleted(pendingDeleteId);
      setPendingDeleteId(0);
      setValidationResult(null);
      setDependencyDialogOpen(false);
      showToast({ message: t("toast.deleteSuccess"), severity: "success" });
      onAfterDelete?.();
    } catch {
      setDependencyDialogOpen(false);
      showToast({ message: t("toast.deleteError"), severity: "error" });
    }
  };

  const handleDependencyDialogClose = () => {
    setDependencyDialogOpen(false);
    setValidationResult(null);
    setPendingDeleteId(0);
  };

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Title>{title}</Title>
      <Link href={`${assetContext.routePath}/add`}>{t("add")}</Link>
      {data.length > 0 && (
        <Grid container spacing={2} marginTop={2}>
          {data.map((item: T & {
            name?: string;
            size?: number;
            photo?: string;
            description?: string;
            address?: Address;
            buildYear?: number;
            apartmentType?: string;
            ownerships?: { share: number }[];
          }) => (
            <Grid key={item.name} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`${assetContext.routePath}/${item.id}`)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardMedia
                    component="img"
                    alt={item.name}
                    height="160"
                    image={item.photo ? `${VITE_BASE_URL}/${item.photo}` : '/assets/properties/placeholder.svg'}
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
                    {(item.address?.street || item.address?.city) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.address.street}
                        {item.address.street && item.address.city && ', '}
                        {item.address.postalCode && `${item.address.postalCode} `}
                        {item.address.city}
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
                </CardActionArea>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`${assetContext.routePath}/edit/${item.id}`)}
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

      <AssetConfirmDialog
        title={t("confirm")}
        contentText={t("confirmDelete")}
        buttonTextConfirm={t("delete")}
        buttonTextCancel={t("cancel")}
        open={open}
        onConfirm={handleDelete}
        onClose={handleClose}
      ></AssetConfirmDialog>

      <AssetDependencyDialog
        open={dependencyDialogOpen}
        validationResult={validationResult}
        onClose={handleDependencyDialogClose}
        onConfirmDelete={handleConfirmDeleteWithDependencies}
      />
    </Paper>
  );
}

export default AssetCardList;
