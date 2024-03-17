import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { Stack } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaTextField from "../../alisa/form/AlisaTextField";

interface ExpenseFormProps extends WithTranslation {
  data: TransactionInputDto;
  onHandleChange: (name: string, value: unknown) => void;
}

function TransactionFormFields({ t, data, onHandleChange }: ExpenseFormProps) {
  const handleChange = (name: keyof TransactionInputDto, value: unknown) => {
    onHandleChange(name, value);
  };

  return (
    <>
      <Stack direction={"row"} spacing={2}>
        <AlisaTextField
          label={t("sender")}
          value={data.sender}
          autoComplete="off"
          autoFocus={true}
          onChange={(e) => handleChange("sender", e.target.value)}
        />

        <AlisaTextField
          label={t("receiver")}
          value={data.receiver}
          autoComplete="off"
          onChange={(e) => handleChange("receiver", e.target.value)}
        />
      </Stack>

      <AlisaTextField
        label={t("description")}
        value={data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
      />

      <Stack direction={"row"} spacing={2}>
        <AlisaDatePicker
          label={t("transactionDate")}
          value={data.transactionDate}
          onChange={(newValue) => handleChange("transactionDate", newValue)}
        />
        <AlisaDatePicker
          label={t("accountingDate")}
          value={data.accountingDate}
          onChange={(newValue) => handleChange("accountingDate", newValue)}
        />
      </Stack>

      <Stack direction={"row"} spacing={2}>
        <AlisaNumberField
          label={t("totalAmount")}
          value={data.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          adornment="€"
        />
      </Stack>
    </>
  );
}
export default withTranslation(transactionContext.name)(TransactionFormFields);
