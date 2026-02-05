import { WithTranslation, withTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import ApiClient from "@alisa-lib/api-client";
import InvestmentCalculatorResults, { SavedInvestmentCalculation } from "./InvestmentCalculatorResults";

interface InvestmentCalculationViewDialogProps extends WithTranslation {
  calculationId: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function InvestmentCalculationViewDialog({
  t,
  calculationId,
  open,
  onClose,
}: InvestmentCalculationViewDialogProps) {
  const [calculation, setCalculation] = React.useState<SavedInvestmentCalculation | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (open && calculationId > 0) {
      loadCalculation();
    }
  }, [open, calculationId]);

  const loadCalculation = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get<SavedInvestmentCalculation>(
        'real-estate/investment',
        calculationId
      );
      setCalculation(data);
    } catch (error) {
      console.error('Error loading calculation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {calculation?.name || t('investment-calculator:calculation')}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div>{t('common:loading')}</div>
        ) : (
          <InvestmentCalculatorResults
            results={calculation}
            showSaveButton={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(['investment-calculator', 'common'])(InvestmentCalculationViewDialog);
