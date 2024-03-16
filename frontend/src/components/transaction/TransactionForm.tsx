import { Dialog, DialogContent, Stack } from "@mui/material";
import { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import AlisaFormHandler from "../alisa/form/AlisaFormHandler";
import DataService from "@alisa-lib/data-service";
import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto";

import React from "react";
import AlisaLoadingProgress from "../alisa/AlisaLoadingProgress";
import TransactionFormFields from "./components/TransactionFormFields";
import AlisaContent from "../alisa/AlisaContent";
import { TransactionType } from "./Transactions.tsx";

interface TransactionFormProps extends WithTranslation {
  id?: number;
  open: boolean;
  propertyId?: number;
  type?: TransactionType;
  onAfterSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function TransactionForm({
  t,
  open,
  id,
  propertyId,
  type,
  onAfterSubmit,
  onCancel,
  onClose,
}: TransactionFormProps) {
  const [data, setData] = useState<TransactionInputDto>(
    new TransactionInputDto(),
  );
  const [ready, setReady] = useState<boolean>(false);

  const dataService = new DataService<TransactionInputDto>({
    context: transactionContext,
    relations: { expenses: true, incomes: true },
    dataValidateInstance: new TransactionInputDto(),
  });

  React.useEffect(() => {
    if (id === undefined) {
      const fetchData = async () => {
        const defaults = await dataService.getDefaults();
        if (propertyId) {
          defaults.propertyId = propertyId;
        }
        return defaults;
      };

      fetchData().then((data) => {
        setData(data);
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  const handleChange = async (name: string, value: unknown) => {
    let newData = dataService.updateNestedData(data, name, value);

    if (name === "transactionDate") {
      newData = dataService.updateNestedData(newData, "accountingDate", value);
    }

    setData(newData);
  };

  const formComponents = () => {
    return (
      <Stack spacing={2} marginBottom={2}>
        <TransactionFormFields
          data={data}
          onHandleChange={handleChange}
        ></TransactionFormFields>
      </Stack>
    );
  };

  if (ready) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth={true} maxWidth={"lg"}>
        <DialogContent dividers>
          <AlisaContent headerText={t("transaction")}>
            <AlisaFormHandler<TransactionInputDto>
              id={id}
              dataService={dataService}
              data={data}
              formComponents={formComponents()}
              onSetData={setData}
              translation={{
                cancelButton: t("cancel"),
                submitButton: t("save"),
                validationMessageTitle: t("validationErrorTitle"),
              }}
              onCancel={onCancel}
              onAfterSubmit={onAfterSubmit}
            ></AlisaFormHandler>
          </AlisaContent>
        </DialogContent>
      </Dialog>
    );
  } else {
    return <AlisaLoadingProgress></AlisaLoadingProgress>;
  }
}

export default withTranslation(transactionContext.name)(TransactionForm);
