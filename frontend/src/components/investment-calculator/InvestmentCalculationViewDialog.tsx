import { WithTranslation, withTranslation } from "react-i18next";
import React from "react";
import ApiClient from "@alisa-lib/api-client";
import InvestmentCalculatorResults, { SavedInvestmentCalculation } from "./InvestmentCalculatorResults";
import { AlisaDialog } from "../alisa";

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

  const loadCalculation = React.useCallback(async () => {
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
  }, [calculationId]);

  React.useEffect(() => {
    if (open && calculationId > 0) {
      loadCalculation();
    }
  }, [open, calculationId, loadCalculation]);

  return (
    <AlisaDialog
      open={open}
      title={calculation?.name || t('investment-calculator:calculation')}
      maxWidth="md"
      onClose={onClose}
    >
      {loading ? (
        <div>{t('common:loading')}</div>
      ) : (
        <InvestmentCalculatorResults
          results={calculation}
          showSaveButton={false}
        />
      )}
    </AlisaDialog>
  );
}

export default withTranslation(['investment-calculator', 'common'])(InvestmentCalculationViewDialog);
