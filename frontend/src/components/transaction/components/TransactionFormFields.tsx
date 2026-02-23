import { TransactionInput, TransactionStatus } from "@asset-types";
import { transactionContext } from "@asset-lib/asset-contexts";
import { getFieldErrorProps } from "@asset-lib/form-utils";
import { Stack } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import AssetDatePicker from "../../asset/form/AssetDatePicker";
import AssetNumberField from "../../asset/form/AssetNumberField";
import AssetTextField from "../../asset/form/AssetTextField";
import AssetTransactionStatusSelect from "../../asset/data/AssetTransactionStatusSelect.tsx";
import AssetTransactionTypeSelect from "../../asset/data/AssetTransactionTypeSelect.tsx";

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
        <AssetTransactionStatusSelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelect={handleStatusChange}
          selectedValue={props.data.status as TransactionStatus}
        ></AssetTransactionStatusSelect>
        <AssetTransactionTypeSelect
          variant={"split-button"}
          t={props.t}
          direction={"column"}
          onSelect={handleTransactionTypeChange}
          selectedValue={props.data.type as number}
          visible={(props.data.id as number) > 0}
        ></AssetTransactionTypeSelect>
      </Stack>

      <Stack direction={"row"} spacing={2}>
        <AssetTextField
          label={props.t("sender")}
          value={props.data.sender}
          autoComplete="off"
          autoFocus={true}
          onChange={(e) => handleChange("sender", e.target.value)}
          {...getErrorProps("sender")}
        />

        <AssetTextField
          label={props.t("receiver")}
          value={props.data.receiver}
          autoComplete="off"
          onChange={(e) => handleChange("receiver", e.target.value)}
          {...getErrorProps("receiver")}
        />
      </Stack>

      <AssetTextField
        label={props.t("description")}
        value={props.data.description}
        autoComplete="off"
        onChange={(e) => handleChange("description", e.target.value)}
        onBlur={() => props.onDescriptionChange(props.data.description)}
        {...getErrorProps("description")}
      />

      <Stack direction={"row"} spacing={2}>
        <AssetNumberField
          label={props.t("totalAmount")}
          value={props.data.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          onBlur={() => props.onAmountChange(props.data.amount)}
          adornment="€"
          {...getErrorProps("amount")}
        />
        <AssetDatePicker
          label={props.t("transactionDate")}
          value={props.data.transactionDate}
          onChange={(newValue) => handleChange("transactionDate", newValue)}
          {...getErrorProps("transactionDate")}
        />
        <AssetDatePicker
          label={props.t("accountingDate")}
          value={props.data.accountingDate}
          onChange={(newValue) => handleChange("accountingDate", newValue)}
          {...getErrorProps("accountingDate")}
        />
      </Stack>
    </>
  );
}
export default withTranslation(transactionContext.name)(TransactionFormFields);
