import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Button,
  IconButton,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import ApiClient from "@alisa-lib/api-client";
import { adminContext } from "@alisa-lib/alisa-contexts";
import AdminTierForm from "./AdminTierForm";

interface Tier {
  id: number;
  name: string;
  price: number;
  maxProperties: number;
  sortOrder: number;
  isDefault: boolean;
}

function AdminTierList({ t }: WithTranslation) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  const fetchTiers = async () => {
    try {
      const options = await ApiClient.getOptions();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/tiers`,
        {
          headers: options.headers,
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTiers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleAdd = () => {
    setEditingTier(null);
    setFormOpen(true);
  };

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier);
    setFormOpen(true);
  };

  const handleDelete = async (tierId: number) => {
    if (!window.confirm(t("tierDeleteConfirm"))) {
      return;
    }
    const options = await ApiClient.getOptions();
    await fetch(
      `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/tiers/${tierId}`,
      {
        method: "DELETE",
        headers: options.headers,
      },
    );
    fetchTiers();
  };

  const handleSave = async (tier: Tier | Omit<Tier, "id">) => {
    const options = await ApiClient.getOptions();
    const isEdit = "id" in tier && tier.id;
    const url = isEdit
      ? `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/tiers/${tier.id}`
      : `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/tiers`;

    await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tier),
    });

    setFormOpen(false);
    fetchTiers();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          {t("tierAdd")}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("tierName")}</TableCell>
              <TableCell>{t("tierPrice")}</TableCell>
              <TableCell>{t("tierMaxProperties")}</TableCell>
              <TableCell>{t("tierDefault")}</TableCell>
              <TableCell>{t("tierActions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>{tier.name}</TableCell>
                <TableCell>
                  {Number(tier.price).toFixed(2)} {t("tierCurrency")}
                </TableCell>
                <TableCell>
                  {tier.maxProperties === 0
                    ? t("tierUnlimited")
                    : tier.maxProperties}
                </TableCell>
                <TableCell>
                  {tier.isDefault && (
                    <Chip
                      label={t("tierDefault")}
                      color="primary"
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(tier)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(tier.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AdminTierForm
        open={formOpen}
        tier={editingTier}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}

export default withTranslation(adminContext.name)(AdminTierList);
