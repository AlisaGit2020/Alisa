import { Dialog, DialogContent, Stack } from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { ExpenseInputDto } from "@alisa-backend/accounting/expense/dtos/expense-input.dto";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import { expenseContext, expenseTypeContext } from "@alisa-lib/alisa-contexts";
import DataService from "@alisa-lib/data-service";
import AlisaFormHandler from "../../alisa/form/AlisaFormHandler";
import AlisaContent from "../../alisa/AlisaContent";
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
  const [data, setData] = useState<ExpenseInputDto>({
    description: "",
    amount: 0,
    quantity: 1,
    totalAmount: 0,
    accountingDate: new Date(),
    expenseTypeId: defaultExpenseTypeId,
    propertyId: propertyId,
    transactionId: null,
  });

  const dataService = new DataService<ExpenseInputDto>({
    context: expenseContext,
    dataValidateInstance: new ExpenseInputDto(),
  });

  const handleChange = (
    name: keyof ExpenseInputDto,
    value: ExpenseInputDto[keyof ExpenseInputDto]
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

  const formComponents = (
    <Stack spacing={2} marginBottom={2}>
      <AlisaDatePicker
        label={t("accountingDate")}
        value={data.accountingDate || new Date()}
        onChange={(value) =>
          handleChange("accountingDate", value?.toDate() || new Date())
        }
      />

      <AlisaSelect<ExpenseInputDto, ExpenseType>
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
    </Stack>
  );

  return (
    <Dialog open={true} onClose={onClose} fullWidth={true} maxWidth="sm">
      <DialogContent dividers>
        <AlisaContent headerText={t(id ? "editExpense" : "addExpense")}>
          <AlisaFormHandler<ExpenseInputDto>
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
        </AlisaContent>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation("accounting")(ExpenseForm);
