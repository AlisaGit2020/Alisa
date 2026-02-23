import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, CardContent, Tab, Tabs } from "@mui/material";
import React from "react";
import { useSearchParams } from "react-router-dom";
import InvestmentCalculatorForm from "./InvestmentCalculatorForm";
import SavedCalculations from "./SavedCalculations";
import PageHeader from "../asset/PageHeader";
import { useToast } from "../asset";

function InvestmentCalculatorProtected({ t }: WithTranslation) {
  const [tabValue, setTabValue] = React.useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formKey, setFormKey] = React.useState(0);
  const { showToast } = useToast();

  React.useEffect(() => {
    // Check if we just saved successfully
    if (searchParams.get('saved') === 'true') {
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, t]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewCalculation = () => {
    setTabValue(0);
    setFormKey(prev => prev + 1); // Force form reset
  };

  const handleAfterSubmit = () => {
    // Switch to saved calculations tab after successful save
    setTabValue(1);
    setFormKey(prev => prev + 1); // Reset form
  };

  const handleCancel = () => {
    setFormKey(prev => prev + 1); // Reset form
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
              onCancel={handleCancel}
              onAfterSubmit={handleAfterSubmit}
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
