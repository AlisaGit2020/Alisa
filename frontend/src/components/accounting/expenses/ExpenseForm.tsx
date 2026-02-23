import { Stack, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { ExpenseInput, ExpenseType } from "@asset-types";
import AssetTextField from "../../asset/form/AssetTextField";
import AssetNumberField from "../../asset/form/AssetNumberField";
import AssetDatePicker from "../../asset/form/AssetDatePicker";
import AssetSelect from "../../asset/data/AssetSelect";
import { expenseContext, expenseTypeContext } from "@asset-lib/asset-contexts";
import DataService from "@asset-lib/data-service";
import AssetFormHandler from "../../asset/form/AssetFormHandler";
import { AssetAlert, AssetButton, AssetDialog, AssetConfirmDialog, useAssetToast } from "../../asset";
import { getNumber } from "@asset-lib/functions";
import { getFieldErrorProps } from "@asset-lib/form-utils";

interface ExpenseFormProps extends WithTranslation {
  id?: number;
  propertyId?: number;
  defaultExpenseTypeId?: number;
  onCancel: () => void;
  onAfterSubmit: () => void;
  onClose: () => void;
}

function ExpenseForm({
  t,
  id,
  propertyId,
  defaultExpenseTypeId,
  onCancel,
  onAfterSubmit,
  onClose,
}: ExpenseFormProps) {
  const [data, setData] = useState<ExpenseInput>({
    description: "",
    amount: 0,
    quantity: 1,
    totalAmount: 0,
    accountingDate: new Date(),
    expenseTypeId: defaultExpenseTypeId,
    propertyId: propertyId,
    transactionId: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showToast } = useAssetToast();

  const dataService = new DataService<ExpenseInput>({
    context: expenseContext,
  });

  const handleChange = (
    name: keyof ExpenseInput,
    value: ExpenseInput[keyof ExpenseInput]
  ) => {
    let newData = dataService.updateNestedData(data, name, value);

    // Auto-calculate totalAmount when quantity or amount changes
    if (name === "quantity" || name === "amount") {
      const quantity = name === "quantity" ? (value as number) : newData.quantity;
      const amount = name === "amount" ? (value as number) : newData.amount;
      newData = dataService.updateNestedData(
        newData,
        "totalAmount",
        quantity * amount
      );
    }

    // Auto-calculate amount when totalAmount changes
    if (name === "totalAmount" && newData.quantity > 0) {
      const amount = (value as number) / newData.quantity;
      newData = dataService.updateNestedData(newData, "amount", amount);
    }

    setData(newData);
  };

  const handleDelete = async () => {
    if (id) {
      await dataService.delete(id);
      setDeleteDialogOpen(false);
      showToast({ message: t("common:toast.deleteSuccess"), severity: "success" });
      onAfterSubmit();
    }
  };

  const isLinkedToTransaction = data.transactionId != null;

  const renderFormContent = (fieldErrors: Partial<Record<keyof ExpenseInput, string>>) => (
    <Stack spacing={2} marginBottom={2}>
      {isLinkedToTransaction && (
        <AssetAlert severity="info" content={t("editNotAllowed")} />
      )}

      <AssetDatePicker
        label={t("accountingDate")}
        value={data.accountingDate || new Date()}
        onChange={(value) =>
          handleChange("accountingDate", value?.toDate() || new Date())
        }
        disabled={isLinkedToTransaction}
        {...getFieldErrorProps<ExpenseInput>(fieldErrors, "accountingDate")}
      />

      <AssetSelect<ExpenseInput, ExpenseType>
        label={t("expenseType")}
        dataService={
          new DataService<ExpenseType>({
            context: expenseTypeContext,
            fetchOptions: { order: { key: "ASC" } },
          })
        }
        fieldName="expenseTypeId"
        value={data.expenseTypeId}
        onHandleChange={handleChange}
        disabled={isLinkedToTransaction}
        t={t}
        translateKeyPrefix="expense-type"
        {...getFieldErrorProps<ExpenseInput>(fieldErrors, "expenseTypeId")}
      />

      <AssetTextField
        label={t("description")}
        value={data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
        disabled={isLinkedToTransaction}
        {...getFieldErrorProps<ExpenseInput>(fieldErrors, "description")}
      />

      <Stack direction="row" spacing={2}>
        <AssetNumberField
          label={t("quantity")}
          value={data.quantity}
          onChange={(e) => handleChange("quantity", getNumber(e.target.value, 0))}
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<ExpenseInput>(fieldErrors, "quantity")}
        />
        <AssetNumberField
          label={t("amount")}
          value={data.amount}
          onChange={(e) => handleChange("amount", getNumber(e.target.value, 2))}
          adornment="€"
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<ExpenseInput>(fieldErrors, "amount")}
        />
        <AssetNumberField
          label={t("totalAmount")}
          value={data.totalAmount}
          onChange={(e) => handleChange("totalAmount", getNumber(e.target.value, 2))}
          adornment="€"
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<ExpenseInput>(fieldErrors, "totalAmount")}
        />
      </Stack>

      {id && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <AssetButton
            label={t("delete")}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isLinkedToTransaction}
          />
        </Box>
      )}
    </Stack>
  );

  return (
    <>
      <AssetDialog
        open={true}
        title={t(id ? "editExpense" : "addExpense")}
        maxWidth="sm"
        onClose={onClose}
      >
        <AssetFormHandler<ExpenseInput>
          id={id}
          dataService={dataService}
          data={data}
          renderForm={renderFormContent}
          onSetData={setData}
          validationRules={{
            description: { required: true },
            expenseTypeId: { required: true },
            accountingDate: { validDate: true },
            quantity: { min: 1 },
            totalAmount: { min: 0.01 },
          }}
          submitDisabled={isLinkedToTransaction}
          translation={{
            cancelButton: t("cancel"),
            submitButton: t("save"),
            validationMessageTitle: t("validationErrorTitle"),
          }}
          onCancel={onCancel}
          onAfterSubmit={onAfterSubmit}
        />
      </AssetDialog>

      <AssetConfirmDialog
        title={t("confirm")}
        contentText={t("confirmDeleteExpense")}
        buttonTextConfirm={t("delete")}
        buttonTextCancel={t("cancel")}
        open={deleteDialogOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}

export default withTranslation("accounting")(ExpenseForm);
