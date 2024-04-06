import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { Stack } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaTransactionStatusSelect from "../../alisa/data/AlisaTransactionStatusSelect.tsx";
import { TransactionStatus } from "@alisa-backend/common/types.ts";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";

interface ExpenseFormProps extends WithTranslation {
  data: TransactionInputDto;
  onHandleChange: (name: string, value: unknown) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
}

function TransactionFormFields(props: ExpenseFormProps) {
  const handleChange = (name: keyof TransactionInputDto, value: unknown) => {
    props.onHandleChange(name, value);
  };

  const handleStatusChange = (value: number) => {
    props.onHandleChange("status", value);
  };

  const handleTransactionTypeChange = (value: number) => {
    props.onHandleChange("type", value);
  };

  return (
    <>
      <Stack direction={"row"} spacing={2} sx={{ paddingBottom: 1 }}>
        <AlisaTransactionStatusSelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelect={handleStatusChange}
          selectedValue={props.data.status as TransactionStatus}
        ></AlisaTransactionStatusSelect>
        <AlisaTransactionTypeSelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelectTransactionType={handleTransactionTypeChange}
          defaultTransactionTypeId={props.data.type}
        ></AlisaTransactionTypeSelect>
      </Stack>

      <Stack direction={"row"} spacing={2}>
        <AlisaTextField
          label={props.t("sender")}
          value={props.data.sender}
          autoComplete="off"
          autoFocus={true}
          onChange={(e) => handleChange("sender", e.target.value)}
        />

        <AlisaTextField
          label={props.t("receiver")}
          value={props.data.receiver}
          autoComplete="off"
          onChange={(e) => handleChange("receiver", e.target.value)}
        />
      </Stack>

      <AlisaTextField
        label={props.t("description")}
        value={props.data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
        onBlur={() => props.onDescriptionChange(props.data.description)}
      />

      <Stack direction={"row"} spacing={2}>
        <AlisaNumberField
          label={props.t("totalAmount")}
          value={props.data.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          onBlur={() => props.onAmountChange(props.data.amount)}
          adornment="€"
        />
        <AlisaDatePicker
          label={props.t("transactionDate")}
          value={props.data.transactionDate}
          onChange={(newValue) => handleChange("transactionDate", newValue)}
        />
        <AlisaDatePicker
          label={props.t("accountingDate")}
          value={props.data.accountingDate}
          onChange={(newValue) => handleChange("accountingDate", newValue)}
        />
      </Stack>
    </>
  );
}
export default withTranslation(transactionContext.name)(TransactionFormFields);
