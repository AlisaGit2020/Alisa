import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { TFunction } from "i18next";
import { useState } from "react";
import AlisaSelect from "../../alisa/data/AlisaSelect.tsx";
import { OpImportInput } from "@alisa-backend/import/op/dtos/op-import-input.dto";
import DataService from "@alisa-lib/data-service";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity";
import {
  propertyContext,
  expenseTypeContext,
  incomeTypeContext,
  opImportContext,
} from "@alisa-lib/alisa-contexts";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity";
import AlisaFormHandler from "../../alisa/form/AlisaFormHandler";

function TransactionImport(props: {
  t: TFunction;
  open: boolean;
  propertyId: number;
  onClose: () => void;
}) {
  const initialData = new OpImportInput();
  initialData.propertyId = props.propertyId;

  const [data, setData] = useState<OpImportInput>(initialData);
  const dataService = new DataService<OpImportInput>({
    context: opImportContext,
    dataValidateInstance: new OpImportInput(),
  });

  const handleChange = async (name: string, value: unknown) => {
    let newData = dataService.updateNestedData(data, name, value);
    if (name === "file" && value instanceof File) {
      newData = dataService.updateNestedData(newData, "fileName", value.name);
    }
    setData(newData);
  };

  const formComponents = (
    <Stack spacing={2} marginBottom={2}>
      <AlisaSelect<OpImportInput, Property>
        label={props.t("property")}
        dataService={
          new DataService<Property>({
            context: propertyContext,
            fetchOptions: { order: { name: "ASC" } },
          })
        }
        fieldName="propertyId"
        value={data.propertyId}
        onHandleChange={handleChange}
      ></AlisaSelect>
      <AlisaSelect<OpImportInput, ExpenseType>
        label={props.t("defaultExpenseType")}
        dataService={
          new DataService<ExpenseType>({
            context: expenseTypeContext,
            fetchOptions: { order: { name: "ASC" } },
          })
        }
        fieldName="expenseTypeId"
        value={data.expenseTypeId}
        onHandleChange={handleChange}
      ></AlisaSelect>
      <AlisaSelect<OpImportInput, IncomeType>
        label={props.t("defaultIncomeType")}
        dataService={
          new DataService<IncomeType>({
            context: incomeTypeContext,
            fetchOptions: { order: { name: "ASC" } },
          })
        }
        fieldName="incomeTypeId"
        value={data.incomeTypeId}
        onHandleChange={handleChange}
      ></AlisaSelect>
      <TextField
        type={"file"}
        onChange={async (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files) {
            await handleChange("file", files[0]);
          }
        }}
      ></TextField>
    </Stack>
  );

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth={true}
      maxWidth={"lg"}
    >
      <DialogTitle>
        {props.t("importTitle")} <CloudUploadIcon></CloudUploadIcon>
      </DialogTitle>
      <DialogContent dividers>
        <AlisaFormHandler
          formComponents={formComponents}
          translation={{
            submitButton: props.t("import"),
            cancelButton: props.t("cancel"),
            errorMessageTitle: "",
            validationMessageTitle: props.t("validationErrorTitle"),
          }}
          submitButtonIcon={<CloudUploadIcon></CloudUploadIcon>}
          dataService={
            new DataService<OpImportInput>({
              context: opImportContext,
              dataValidateInstance: new OpImportInput(),
            })
          }
          data={data}
          onAfterSubmit={props.onClose}
          onCancel={props.onClose}
          onSetData={setData}
        ></AlisaFormHandler>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionImport;
