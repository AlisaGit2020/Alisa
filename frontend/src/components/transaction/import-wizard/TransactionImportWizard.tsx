import { Box, Stepper, Step, StepLabel, Typography, Paper } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { useImportWizard } from "./hooks/useImportWizard";
import { WIZARD_STEPS } from "./types";
import ImportStep from "./steps/ImportStep";
import ReviewStep from "./steps/ReviewStep";
import AcceptStep from "./steps/AcceptStep";
import DoneStep from "./steps/DoneStep";

function TransactionImportWizard({ t }: WithTranslation) {
  const {
    state,
    nextStep,
    prevStep,
    setFile,
    uploadFile,
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
            file={state.file}
            isUploading={state.isUploading}
            uploadError={state.uploadError}
            onFileSelect={setFile}
            onUpload={uploadFile}
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
