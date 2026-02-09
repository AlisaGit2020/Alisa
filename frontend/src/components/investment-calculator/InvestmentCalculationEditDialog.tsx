import { WithTranslation, withTranslation } from "react-i18next";
import { Card, CardContent } from "@mui/material";
import React from "react";
import { AxiosResponse } from "axios";
import ApiClient from "@alisa-lib/api-client";
import InvestmentCalculatorForm, { InvestmentInputData } from "./InvestmentCalculatorForm";
import InvestmentCalculatorResults, { InvestmentResults, SavedInvestmentCalculation } from "./InvestmentCalculatorResults";
import { AlisaDialog } from "../alisa";

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
  const [results, setResults] = React.useState<InvestmentResults | null>(null);
  const [inputData, setInputData] = React.useState<InvestmentInputData | null>(null);
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
      setResults(data); // Set initial results from saved calculation
      setInputData(data); // Set initial input data
    } catch (error) {
      console.error('Error loading calculation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (data: InvestmentInputData) => {
    try {
      setInputData(data); // Store input data for saving
      const response = await ApiClient.post('real-estate/investment/calculate', data, true) as unknown as AxiosResponse<InvestmentResults>;
      setResults(response.data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const handleSave = async () => {
    if (!inputData) {
      console.error('No input data to save');
      return;
    }

    try {
      await ApiClient.put('real-estate/investment', calculationId, inputData);

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

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
        <Card>
          <CardContent>
            <InvestmentCalculatorForm
              onCalculate={handleCalculate}
              initialValues={calculation || undefined}
            />
            <InvestmentCalculatorResults
              results={results}
              onSave={handleSave}
              showSaveButton={true}
            />
          </CardContent>
        </Card>
      )}
    </AlisaDialog>
  );
}

export default withTranslation(['investment-calculator', 'common'])(InvestmentCalculationEditDialog);
