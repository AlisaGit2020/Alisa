import { WithTranslation, withTranslation } from "react-i18next";
import React from "react";
import ApiClient from "@asset-lib/api-client";
import InvestmentCalculatorForm, { InvestmentInputData } from "./InvestmentCalculatorForm";
import { SavedInvestmentCalculation } from "./InvestmentCalculatorResults";
import { AssetDialog } from "../asset";

interface InvestmentCalculationEditDialogProps extends WithTranslation {
  calculationId: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function InvestmentCalculationEditDialog({
  t,
  calculationId,
  open,
  onClose,
  onSaved,
}: InvestmentCalculationEditDialogProps) {
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

  const handleAfterSubmit = () => {
    if (onSaved) {
      onSaved();
    }
    onClose();
  };

  const convertToInputData = (calc: SavedInvestmentCalculation): Partial<InvestmentInputData> => ({
    id: calc.id,
    deptFreePrice: calc.deptFreePrice,
    deptShare: calc.deptShare,
    transferTaxPercent: calc.transferTaxPercent,
    maintenanceFee: calc.maintenanceFee,
    chargeForFinancialCosts: calc.chargeForFinancialCosts,
    rentPerMonth: calc.rentPerMonth,
    apartmentSize: calc.apartmentSize,
    waterCharge: calc.waterCharge,
    downPayment: calc.downPayment,
    loanInterestPercent: calc.loanInterestPercent,
    loanPeriod: calc.loanPeriod,
    name: calc.name,
  });

  return (
    <AssetDialog
      open={open}
      title={calculation?.name || t('investment-calculator:calculation')}
      maxWidth="md"
      onClose={onClose}
    >
      {loading ? (
        <div>{t('common:loading')}</div>
      ) : (
        <InvestmentCalculatorForm
          id={calculationId}
          initialValues={calculation ? convertToInputData(calculation) : undefined}
          onCancel={onClose}
          onAfterSubmit={handleAfterSubmit}
        />
      )}
    </AssetDialog>
  );
}

export default withTranslation(['investment-calculator', 'common'])(InvestmentCalculationEditDialog);
