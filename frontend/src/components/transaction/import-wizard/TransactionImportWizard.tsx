import { Box, Stepper, Step, StepLabel, Typography, Paper, Alert, Button } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { useImportWizard } from "./hooks/useImportWizard";
import { WIZARD_STEPS } from "./types";
import ImportStep from "./steps/ImportStep";
import ReviewStep from "./steps/ReviewStep";
import AcceptStep from "./steps/AcceptStep";
import DoneStep from "./steps/DoneStep";
import {
  OPEN_PROPERTY_SELECTOR_EVENT,
  PROPERTY_SELECTION_REQUIRED_EVENT,
} from "../../layout/PropertyBadge";
import { useEffect, useState } from "react";
import { getTransactionPropertyId } from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../TransactionLeftMenuItems";

function TransactionImportWizard({ t }: WithTranslation) {
  const {
    state,
    nextStep,
    prevStep,
    setFiles,
    uploadFiles,
    fetchTransactions,
    handleSelectChange,
    handleSelectAllChange,
    clearSelection,
    setTypeForSelected,
    setCategoryTypeForSelected,
    deleteSelected,
    approveAll,
    reset,
  } = useImportWizard();

  // Track global property selection (from AppBar)
  const [globalPropertyId, setGlobalPropertyId] = useState(() => getTransactionPropertyId());

  // Listen for property changes from AppBar
  useEffect(() => {
    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      setGlobalPropertyId(customEvent.detail.propertyId);
    };

    window.addEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);
    return () => {
      window.removeEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);
    };
  }, []);

  // Property is valid if either:
  // 1. AppBar has a property selected (globalPropertyId > 0)
  // 2. There's an active session with a property (state.propertyId > 0)
  const isPropertySelected = globalPropertyId > 0 || state.propertyId > 0;

  // Highlight PropertyBadge on mount if no property is selected at all
  useEffect(() => {
    if (globalPropertyId <= 0 && state.propertyId <= 0) {
      window.dispatchEvent(new CustomEvent(PROPERTY_SELECTION_REQUIRED_EVENT));
    }
  }, [globalPropertyId, state.propertyId]);

  const handleSelectProperty = () => {
    window.dispatchEvent(new CustomEvent(OPEN_PROPERTY_SELECTOR_EVENT));
  };

  const stepLabels = WIZARD_STEPS.map((step) =>
    t(`importWizard.steps.${step}`)
  );

  const renderStep = () => {
    switch (state.activeStep) {
      case 0:
        return (
          <ImportStep
            t={t}
            propertyId={state.propertyId}
            files={state.files}
            isUploading={state.isUploading}
            uploadError={state.uploadError}
            onFilesSelect={setFiles}
            onUpload={uploadFiles}
            onNext={nextStep}
            onFetchTransactions={fetchTransactions}
          />
        );
      case 1:
        return (
          <ReviewStep
            t={t}
            transactions={state.transactions}
            selectedIds={state.selectedIds}
            selectedTransactionTypes={state.selectedTransactionTypes}
            hasUnknownTypes={state.hasUnknownTypes}
            onSelectChange={handleSelectChange}
            onSelectAllChange={handleSelectAllChange}
            onClearSelection={clearSelection}
            onSetType={setTypeForSelected}
            onSetCategoryType={setCategoryTypeForSelected}
            onDelete={deleteSelected}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <AcceptStep
            t={t}
            transactions={state.transactions}
            isApproving={state.isApproving}
            approveError={state.approveError}
            onApprove={approveAll}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return <DoneStep t={t} stats={state.importStats} onReset={reset} />;
      default:
        return null;
    }
  };

  // Show property required message if no property is selected
  if (!isPropertySelected) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("importWizard.title")}
        </Typography>

        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={handleSelectProperty}>
              {t("common:selectProperty")}
            </Button>
          }
        >
          {t("common:propertyRequiredMessage")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t("importWizard.title")}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={state.activeStep}>
          {stepLabels.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box sx={{ mt: 3 }}>{renderStep()}</Box>
    </Box>
  );
}

export default withTranslation(transactionContext.name)(TransactionImportWizard);
