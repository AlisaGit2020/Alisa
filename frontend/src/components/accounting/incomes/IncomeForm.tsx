import { Dialog, DialogContent, Stack } from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { IncomeInputDto } from "@alisa-backend/accounting/income/dtos/income-input.dto";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaSelect from "../../alisa/data/AlisaSelect";
import { incomeContext, incomeTypeContext } from "@alisa-lib/alisa-contexts";
import DataService from "@alisa-lib/data-service";
import AlisaFormHandler from "../../alisa/form/AlisaFormHandler";
import AlisaContent from "../../alisa/AlisaContent";
import { getNumber } from "@alisa-lib/functions";

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
  const [data, setData] = useState<IncomeInputDto>({
    description: "",
    amount: 0,
    quantity: 1,
    totalAmount: 0,
    accountingDate: new Date(),
    incomeTypeId: defaultIncomeTypeId,
    propertyId: propertyId,
    transactionId: null,
  });

  const dataService = new DataService<IncomeInputDto>({
    context: incomeContext,
    dataValidateInstance: new IncomeInputDto(),
  });

  const handleChange = (
    name: keyof IncomeInputDto,
    value: IncomeInputDto[keyof IncomeInputDto]
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

      <AlisaSelect<IncomeInputDto, IncomeType>
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
        <AlisaContent headerText={t(id ? "editIncome" : "addIncome")}>
          <AlisaFormHandler<IncomeInputDto>
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

export default withTranslation("accounting")(IncomeForm);
