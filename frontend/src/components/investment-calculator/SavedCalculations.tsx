import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Paper, Stack } from "@mui/material";
import React from "react";
import ApiClient from "@alisa-lib/api-client";
import { useNavigate } from "react-router-dom";
import { useToast } from "../alisa";
import AlisaDataTable from "../alisa/datatable/AlisaDataTable";
import DataService from "@alisa-lib/data-service";
import InvestmentCalculationViewDialog from "./InvestmentCalculationViewDialog";
import InvestmentCalculationEditDialog from "./InvestmentCalculationEditDialog";
import SavedCalculationsActions from "./SavedCalculationsActions";

interface SavedCalculation {
  id: number;
  name?: string;
  userId: number;
  propertyId?: number;
  deptFreePrice: number;
  rentPerMonth: number;
  cashFlowPerMonth: number;
  rentalYieldPercent: number;
  createdAt?: string;
}

interface SavedCalculationsProps extends WithTranslation {
  onNewCalculation?: () => void;
}

function SavedCalculations({
  t,
  onNewCalculation,
}: SavedCalculationsProps) {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedCalculationId, setSelectedCalculationId] = React.useState<
    number | null
  >(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const dataService = React.useMemo(() => {
    const service = {
      search: async () => {
        const data = await ApiClient.search<SavedCalculation>(
          "real-estate/investment",
          {}
        );
        return data.map((calc) => ({
          ...calc,
          name: calc.name || `#${calc.id}`,
        }));
      },
      delete: async (id: number) => {
        await ApiClient.delete("real-estate/investment", id);
      },
    } as DataService<SavedCalculation>;
    return service;
  }, []);

  const handleSelectChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllChange = (ids: number[]) => {
    setSelectedIds(ids);
  };

  const handleCancelSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await ApiClient.postSaveTask("real-estate/investment/delete", {
        ids: selectedIds,
      });
      if (result.allSuccess) {
        showToast({
          message: t("common:toast.deleteSuccess"),
          severity: "success",
        });
      } else {
        showToast({
          message: t("common:toast.partialSuccess", {
            success: result.rows.success,
            failed: result.rows.failed,
          }),
          severity: "warning",
        });
      }
      setSelectedIds([]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting calculations:", error);
      showToast({
        message: t("common:toast.error"),
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewOpen = (id: number) => {
    setSelectedCalculationId(id);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setSelectedCalculationId(null);
    setViewDialogOpen(false);
  };

  const handleEditOpen = (id: number) => {
    setSelectedCalculationId(id);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setSelectedCalculationId(null);
    setEditDialogOpen(false);
  };

  const handleNewCalculation = () => {
    if (onNewCalculation) {
      onNewCalculation();
    } else {
      navigate("/investment-calculator");
    }
  };

  const handleDelete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Box>
      <Stack spacing={2}>
        <SavedCalculationsActions
          open={selectedIds.length > 0}
          selectedIds={selectedIds}
          onCancel={handleCancelSelection}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
        />

        <Paper>
          <AlisaDataTable<SavedCalculation>
            t={t}
            dataService={dataService}
            fields={[
              { name: "name", label: t("investment-calculator:name") },
              {
                name: "deptFreePrice",
                label: t("investment-calculator:deptFreePrice"),
                format: "currency",
                hideOnMobile: true,
              },
              {
                name: "rentPerMonth",
                label: t("investment-calculator:rentPerMonth"),
                format: "currency",
                hideOnMobile: true,
              },
              {
                name: "cashFlowPerMonth",
                label: t("investment-calculator:cashFlowPerMonth"),
                format: "currency",
              },
              {
                name: "rentalYieldPercent",
                label: t("investment-calculator:rentalYieldPercent"),
                format: "number",
              },
            ]}
            selectedIds={selectedIds}
            onSelectChange={handleSelectChange}
            onSelectAllChange={handleSelectAllChange}
            onOpen={handleViewOpen}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onNewRow={handleNewCalculation}
            refreshTrigger={refreshTrigger}
            sortable
          />
        </Paper>
      </Stack>

      <InvestmentCalculationViewDialog
        calculationId={selectedCalculationId || 0}
        open={viewDialogOpen}
        onClose={handleViewClose}
        onSaved={handleSaved}
      />

      <InvestmentCalculationEditDialog
        calculationId={selectedCalculationId || 0}
        open={editDialogOpen}
        onClose={handleEditClose}
        onSaved={handleSaved}
      />
    </Box>
  );
}

export default withTranslation(["investment-calculator", "common"])(
  SavedCalculations
);
