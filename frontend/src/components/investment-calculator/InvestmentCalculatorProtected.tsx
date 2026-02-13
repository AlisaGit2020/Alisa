import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, CardContent, Tab, Tabs } from "@mui/material";
import React from "react";
import { useSearchParams } from "react-router-dom";
import { AxiosResponse } from "axios";
import InvestmentCalculatorForm, { InvestmentInputData } from "./InvestmentCalculatorForm";
import InvestmentCalculatorResults, { InvestmentResults } from "./InvestmentCalculatorResults";
import SavedCalculations from "./SavedCalculations";
import PageHeader from "../alisa/PageHeader";
import ApiClient from "@alisa-lib/api-client";
import { useToast } from "../alisa";

const STORAGE_KEY = 'investmentCalculator_workInProgress';

function InvestmentCalculatorProtected({ t }: WithTranslation) {
  const [tabValue, setTabValue] = React.useState(0);
  const [results, setResults] = React.useState<InvestmentResults | null>(null);
  const [inputData, setInputData] = React.useState<InvestmentInputData | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formKey, setFormKey] = React.useState(0);
  const { showToast } = useToast();

  // Load saved work from sessionStorage on mount
  React.useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { inputData: savedInputData, results: savedResults } = JSON.parse(saved);
        if (savedInputData) {
          setInputData(savedInputData);
          setFormKey(prev => prev + 1); // Trigger form re-render with loaded data
        }
        if (savedResults) {
          setResults(savedResults);
        }
      } catch (error) {
        console.error('Error loading saved work:', error);
      }
    }
  }, []);

  // Save work to sessionStorage whenever it changes
  React.useEffect(() => {
    if (inputData || results) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ inputData, results }));
    }
  }, [inputData, results]);

  React.useEffect(() => {
    // Check if we just saved successfully
    if (searchParams.get('saved') === 'true') {
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, t]);

  const handleCalculate = async (data: InvestmentInputData) => {
    try {
      setInputData(data);
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
      await ApiClient.post('real-estate/investment', inputData);
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
      // Clear form, sessionStorage and switch to saved calculations tab
      setResults(null);
      setInputData(null);
      setFormKey(prev => prev + 1);
      sessionStorage.removeItem(STORAGE_KEY);
      setTabValue(1);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Don't clear anything when switching tabs
    // Form will be cleared only when "New Calculation" button is clicked
  };

  const handleNewCalculation = () => {
    setTabValue(0);
    setResults(null);
    setInputData(null);
    setFormKey(prev => prev + 1); // Force form reset
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Box>
      <PageHeader
        title={t('investment-calculator:pageTitle')}
        description={t('investment-calculator:pageDescription')}
      />

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tab label={t('investment-calculator:newCalculation')} />
        <Tab label={t('investment-calculator:savedCalculations')} />
      </Tabs>

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <InvestmentCalculatorForm
              key={formKey}
              onCalculate={handleCalculate}
              initialValues={inputData || undefined}
            />
            <InvestmentCalculatorResults
              results={results}
              onSave={handleSave}
              showSaveButton={true}
            />
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <SavedCalculations onNewCalculation={handleNewCalculation} />
      )}
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorProtected);
