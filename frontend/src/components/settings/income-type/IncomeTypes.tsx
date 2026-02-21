import { useState, useCallback, useMemo } from "react";
import { WithTranslation, withTranslation } from "react-i18next";

import AlisaDataTable from "../../alisa/datatable/AlisaDataTable.tsx";
import AlisaConfirmDialog from "../../alisa/dialog/AlisaConfirmDialog";
import AlisaDependencyDialog from "../../alisa/dialog/AlisaDependencyDialog";
import { incomeTypeContext } from "@alisa-lib/alisa-contexts";
import { DeleteValidationResult, IncomeType } from "@alisa-types";
import DataService from "@alisa-lib/data-service";
import ApiClient from "@alisa-lib/api-client";
import AlisaContent from "../../alisa/AlisaContent";
import { useToast } from "../../alisa/toast";

interface IncomeTypesProps extends WithTranslation {
  onAdd: () => void;
  onEdit: (id: number) => void;
}

function IncomeTypes({ t, onAdd, onEdit }: IncomeTypesProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<DeleteValidationResult | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  const dataService = useMemo(
    () => new DataService<IncomeType>({ context: incomeTypeContext, fetchOptions: { order: { name: 'ASC' } } }),
    []
  );

  const handleEdit = (id: number) => {
    onEdit(id);
  };

  const handleAdd = () => {
    onAdd();
  };

  const handleDelete = useCallback(async (id: number) => {
    setPendingDeleteId(id);

    try {
      const validation = await ApiClient.fetch<DeleteValidationResult>(
        `${incomeTypeContext.apiPath}/${id}/can-delete`
      );

      if (validation.dependencies && validation.dependencies.length > 0) {
        setValidationResult(validation);
        setDependencyDialogOpen(true);
      } else {
        setConfirmDialogOpen(true);
      }
    } catch {
      // Fallback to simple confirm if check fails
      setConfirmDialogOpen(true);
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await ApiClient.delete(incomeTypeContext.apiPath, pendingDeleteId);
      setConfirmDialogOpen(false);
      setDependencyDialogOpen(false);
      setValidationResult(null);
      setPendingDeleteId(0);
      setRefreshKey((prev) => prev + 1);
      showToast({ message: t("toast.deleteSuccess"), severity: "success" });
    } catch {
      setConfirmDialogOpen(false);
      setDependencyDialogOpen(false);
      showToast({ message: t("toast.deleteError"), severity: "error" });
    }
  }, [pendingDeleteId, showToast, t]);

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(false);
    setPendingDeleteId(0);
  }, []);

  const handleCloseDependencyDialog = useCallback(() => {
    setDependencyDialogOpen(false);
    setValidationResult(null);
    setPendingDeleteId(0);
  }, []);

  return (
    <AlisaContent headerText={t("incomeTypes")}>
      <AlisaDataTable<IncomeType>
        key={refreshKey}
        t={t}
        dataService={dataService}
        fields={[
          { name: "name" },
          { name: "description", hideOnMobile: true },
          { name: "isTaxable", format: "boolean" },
        ]}
        onNewRow={handleAdd}
        onEdit={handleEdit}
        onOpen={() => {}}
        onDeleteRequest={handleDelete}
      />

      <AlisaConfirmDialog
        open={confirmDialogOpen}
        title={t("common:confirmDelete")}
        contentText={t("common:confirmDeleteMessage")}
        buttonTextCancel={t("common:cancel")}
        buttonTextConfirm={t("common:delete")}
        onConfirm={confirmDelete}
        onClose={handleCloseConfirmDialog}
      />

      <AlisaDependencyDialog
        open={dependencyDialogOpen}
        validationResult={validationResult}
        onClose={handleCloseDependencyDialog}
        onConfirmDelete={confirmDelete}
      />
    </AlisaContent>
  );
}

export default withTranslation(incomeTypeContext.name)(IncomeTypes);
