import { TransactionInput, TransactionStatus } from "@alisa-types";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { getFieldErrorProps } from "@alisa-lib/form-utils";
import { Stack } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker";
import AlisaNumberField from "../../alisa/form/AlisaNumberField";
import AlisaTextField from "../../alisa/form/AlisaTextField";
import AlisaTransactionStatusSelect from "../../alisa/data/AlisaTransactionStatusSelect.tsx";
import AlisaTransactionTypeSelect from "../../alisa/data/AlisaTransactionTypeSelect.tsx";

interface TransactionFormFieldsProps extends WithTranslation {
  data: TransactionInput;
  fieldErrors?: Partial<Record<keyof TransactionInput, string>>;
  onHandleChange: (name: string, value: unknown) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
}

function TransactionFormFields(props: TransactionFormFieldsProps) {
  const handleChange = (name: keyof TransactionInput, value: unknown) => {
    props.onHandleChange(name, value);
  };

  const getErrorProps = (field: keyof TransactionInput) =>
    getFieldErrorProps<TransactionInput>(props.fieldErrors ?? {}, field);

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
          onSelect={handleTransactionTypeChange}
          selectedValue={props.data.type as number}
          visible={(props.data.id as number) > 0}
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
          {...getErrorProps("receiver")}
        />
      </Stack>

      <AlisaTextField
        label={props.t("description")}
        value={props.data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
        onBlur={() => props.onDescriptionChange(props.data.description)}
        {...getErrorProps("description")}
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
