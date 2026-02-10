import { Stack, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { ExpenseInput, ExpenseType } from "@alisa-types";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import { expenseContext, expenseTypeContext } from "@alisa-lib/alisa-contexts";
import DataService from "@alisa-lib/data-service";
import AlisaFormHandler from "../../alisa/form/AlisaFormHandler";
import { AlisaButton, AlisaDialog, AlisaConfirmDialog, useToast } from "../../alisa";
import { getNumber } from "@alisa-lib/functions";

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
  const { showToast } = useToast();

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

  const formComponents = (
    <Stack spacing={2} marginBottom={2}>
      <AlisaDatePicker
        label={t("accountingDate")}
        value={data.accountingDate || new Date()}
        onChange={(value) =>
          handleChange("accountingDate", value?.toDate() || new Date())
        }
      />

      <AlisaSelect<ExpenseInput, ExpenseType>
        label={t("expenseType")}
        dataService={
          new DataService<ExpenseType>({
            context: expenseTypeContext,
            fetchOptions: { order: { name: "ASC" } },
          })
        }
        fieldName="expenseTypeId"
        value={data.expenseTypeId}
        onHandleChange={handleChange}
      />

      <AlisaTextField
        label={t("description")}
        value={data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
      />

      <Stack direction="row" spacing={2}>
        <AlisaNumberField
          label={t("quantity")}
          value={data.quantity}
          onChange={(e) => handleChange("quantity", getNumber(e.target.value, 0))}
        />
        <AlisaNumberField
          label={t("amount")}
          value={data.amount}
          onChange={(e) => handleChange("amount", getNumber(e.target.value, 2))}
          adornment="€"
        />
        <AlisaNumberField
          label={t("totalAmount")}
          value={data.totalAmount}
          onChange={(e) => handleChange("totalAmount", getNumber(e.target.value, 2))}
          adornment="€"
        />
      </Stack>

      {id && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <AlisaButton
            label={t("delete")}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          />
        </Box>
      )}
    </Stack>
  );

  return (
    <>
      <AlisaDialog
        open={true}
        title={t(id ? "editExpense" : "addExpense")}
        maxWidth="sm"
        onClose={onClose}
      >
        <AlisaFormHandler<ExpenseInput>
          id={id}
          dataService={dataService}
          data={data}
          formComponents={formComponents}
          onSetData={setData}
          translation={{
            cancelButton: t("cancel"),
            submitButton: t("save"),
            validationMessageTitle: t("validationErrorTitle"),
          }}
          onCancel={onCancel}
          onAfterSubmit={onAfterSubmit}
        />
      </AlisaDialog>

      <AlisaConfirmDialog
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
