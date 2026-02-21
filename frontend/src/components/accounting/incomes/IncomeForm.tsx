import { Stack, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { IncomeInput, IncomeType } from "@alisa-types";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import { incomeContext, incomeTypeContext } from "@alisa-lib/alisa-contexts";
import DataService from "@alisa-lib/data-service";
import AlisaFormHandler from "../../alisa/form/AlisaFormHandler";
import { AlisaAlert, AlisaButton, AlisaDialog, AlisaConfirmDialog, useToast } from "../../alisa";
import { getNumber } from "@alisa-lib/functions";
import { getFieldErrorProps } from "@alisa-lib/form-utils";

interface IncomeFormProps extends WithTranslation {
  id?: number;
  propertyId?: number;
  defaultIncomeTypeId?: number;
  onCancel: () => void;
  onAfterSubmit: () => void;
  onClose: () => void;
}

function IncomeForm({
  t,
  id,
  propertyId,
  defaultIncomeTypeId,
  onCancel,
  onAfterSubmit,
  onClose,
}: IncomeFormProps) {
  const [data, setData] = useState<IncomeInput>({
    description: "",
    amount: 0,
    quantity: 1,
    totalAmount: 0,
    accountingDate: new Date(),
    incomeTypeId: defaultIncomeTypeId,
    propertyId: propertyId,
    transactionId: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();

  const dataService = new DataService<IncomeInput>({
    context: incomeContext,
  });

  const handleChange = (
    name: keyof IncomeInput,
    value: IncomeInput[keyof IncomeInput]
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

  const renderFormContent = (fieldErrors: Partial<Record<keyof IncomeInput, string>>) => (
    <Stack spacing={2} marginBottom={2}>
      {isLinkedToTransaction && (
        <AlisaAlert severity="info" content={t("editNotAllowed")} />
      )}

      <AlisaDatePicker
        label={t("accountingDate")}
        value={data.accountingDate || new Date()}
        onChange={(value) =>
          handleChange("accountingDate", value?.toDate() || new Date())
        }
        disabled={isLinkedToTransaction}
        {...getFieldErrorProps<IncomeInput>(fieldErrors, "accountingDate")}
      />

      <AlisaSelect<IncomeInput, IncomeType>
        label={t("incomeType")}
        dataService={
          new DataService<IncomeType>({
            context: incomeTypeContext,
            fetchOptions: { order: { name: "ASC" } },
          })
        }
        fieldName="incomeTypeId"
        value={data.incomeTypeId}
        onHandleChange={handleChange}
        disabled={isLinkedToTransaction}
        {...getFieldErrorProps<IncomeInput>(fieldErrors, "incomeTypeId")}
      />

      <AlisaTextField
        label={t("description")}
        value={data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
        disabled={isLinkedToTransaction}
        {...getFieldErrorProps<IncomeInput>(fieldErrors, "description")}
      />

      <Stack direction="row" spacing={2}>
        <AlisaNumberField
          label={t("quantity")}
          value={data.quantity}
          onChange={(e) => handleChange("quantity", getNumber(e.target.value, 0))}
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<IncomeInput>(fieldErrors, "quantity")}
        />
        <AlisaNumberField
          label={t("amount")}
          value={data.amount}
          onChange={(e) => handleChange("amount", getNumber(e.target.value, 2))}
          adornment="€"
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<IncomeInput>(fieldErrors, "amount")}
        />
        <AlisaNumberField
          label={t("totalAmount")}
          value={data.totalAmount}
          onChange={(e) => handleChange("totalAmount", getNumber(e.target.value, 2))}
          adornment="€"
          disabled={isLinkedToTransaction}
          {...getFieldErrorProps<IncomeInput>(fieldErrors, "totalAmount")}
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
            disabled={isLinkedToTransaction}
          />
        </Box>
      )}
    </Stack>
  );

  return (
    <>
      <AlisaDialog
        open={true}
        title={t(id ? "editIncome" : "addIncome")}
        maxWidth="sm"
        onClose={onClose}
      >
        <AlisaFormHandler<IncomeInput>
          id={id}
          dataService={dataService}
          data={data}
          renderForm={renderFormContent}
          onSetData={setData}
          validationRules={{
            description: { required: true },
            incomeTypeId: { required: true },
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
      </AlisaDialog>

      <AlisaConfirmDialog
        title={t("confirm")}
        contentText={t("confirmDeleteIncome")}
        buttonTextConfirm={t("delete")}
        buttonTextCancel={t("cancel")}
        open={deleteDialogOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}

export default withTranslation("accounting")(IncomeForm);
