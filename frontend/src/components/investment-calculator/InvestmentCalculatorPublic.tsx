import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Container, Link, Typography } from "@mui/material";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import { AxiosResponse } from "axios";
import InvestmentCalculatorForm, { InvestmentInputData } from "./InvestmentCalculatorForm";
import InvestmentCalculatorResults, { InvestmentResults } from "./InvestmentCalculatorResults";
import LoginDialog from "../login/LoginDialog";
import ApiClient from "@alisa-lib/api-client";
import { useTranslation } from "react-i18next";
import { useToast } from "../alisa";

function InvestmentCalculatorPublic({ t }: WithTranslation) {
  const [results, setResults] = React.useState<InvestmentResults | null>(null);
  const [inputData, setInputData] = React.useState<InvestmentInputData | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const { showToast } = useToast();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

  React.useEffect(() => {
    // Check if we just saved successfully (coming back from login)
    if (searchParams.get('saved') === 'true') {
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
      // Clear the URL parameter
      navigate('/investment-calculator', { replace: true });
    }
  }, [searchParams, navigate, showToast, t]);

  const handleCalculate = async (data: InvestmentInputData) => {
    try {
      setInputData(data);
      // Call the public calculate endpoint (no auth required)
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

    if (!isAuthenticated) {
      // Anonymous user trying to save - store in sessionStorage and show login dialog
      sessionStorage.setItem('pendingInvestmentCalculation', JSON.stringify(inputData));
      sessionStorage.setItem('returnUrl', '/investment-calculator');
      setLoginDialogOpen(true);
      return;
    }

    // Authenticated user - save directly
    try {
      await ApiClient.post('real-estate/investment', inputData);
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Simple language selector at the top */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 24,
          display: 'flex',
          gap: 1,
          fontSize: '0.875rem',
          zIndex: 10,
        }}
      >
        <Link
          component="button"
          onClick={() => changeLanguage('fi')}
          sx={{
            textDecoration: 'none',
            color: i18n.language === 'fi' ? 'primary.main' : 'text.secondary',
            fontWeight: i18n.language === 'fi' ? 600 : 400,
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          FI
        </Link>
        <Typography sx={{ color: 'text.secondary' }}>|</Typography>
        <Link
          component="button"
          onClick={() => changeLanguage('en')}
          sx={{
            textDecoration: 'none',
            color: i18n.language === 'en' ? 'primary.main' : 'text.secondary',
            fontWeight: i18n.language === 'en' ? 600 : 400,
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          EN
        </Link>
      </Box>

      <Box sx={{ py: 6, flexGrow: 1 }}>
        <Container maxWidth="md">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
              {t('investment-calculator:title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('investment-calculator:subtitle')}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 4,
              boxShadow: 1,
            }}
          >
            <InvestmentCalculatorForm onCalculate={handleCalculate} />
            <InvestmentCalculatorResults
              results={results}
              onSave={handleSave}
              showSaveButton={true}
            />
          </Box>
        </Container>
      </Box>

      <LoginDialog open={loginDialogOpen} onClose={handleCloseLoginDialog} />
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorPublic);
