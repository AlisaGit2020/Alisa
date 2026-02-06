import { WithTranslation, withTranslation } from "react-i18next";
import { Alert, Box, Button, Card, Container, Grid, Link, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import CalculateIcon from "@mui/icons-material/Calculate";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useTranslation } from "react-i18next";
import React from "react";
import LoginDialog from "../login/LoginDialog";
import InvestmentCalculatorForm, { InvestmentInputData } from "../investment-calculator/InvestmentCalculatorForm";
import InvestmentCalculatorResults, { InvestmentResults } from "../investment-calculator/InvestmentCalculatorResults";
import ApiClient from "@alisa-lib/api-client";

function LandingPage({ t }: WithTranslation) {
  const { i18n } = useTranslation();
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [results, setResults] = React.useState<InvestmentResults | null>(null);
  const [inputData, setInputData] = React.useState<InvestmentInputData | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [searchParams] = useSearchParams();
  const calculatorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Check if we just saved successfully (coming back from login)
    if (searchParams.get('saved') === 'true') {
      setSaveSuccess(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSaveSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleLogin = () => {
    setLoginDialogOpen(true);
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

  const handleTryCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCalculate = async (data: InvestmentInputData) => {
    try {
      setInputData(data);
      const response: any = await ApiClient.post('real-estate/investment/calculate', data, true);
      setResults(response.data || response);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const handleSave = async () => {
    if (inputData) {
      sessionStorage.setItem('pendingInvestmentCalculation', JSON.stringify(inputData));
      sessionStorage.setItem('returnUrl', '/');
      setLoginDialogOpen(true);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
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
            color: 'white',
            fontWeight: i18n.language === 'fi' ? 700 : 400,
            opacity: i18n.language === 'fi' ? 1 : 0.7,
            cursor: 'pointer',
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          FI
        </Link>
        <Typography sx={{ color: 'white', opacity: 0.7 }}>|</Typography>
        <Link
          component="button"
          onClick={() => changeLanguage('en')}
          sx={{
            textDecoration: 'none',
            color: 'white',
            fontWeight: i18n.language === 'en' ? 700 : 400,
            opacity: i18n.language === 'en' ? 1 : 0.7,
            cursor: 'pointer',
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          EN
        </Link>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #434343 0%, #000000 100%)',
          color: 'white',
          py: 12,
          mb: 8,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            {t('landing:title')}
          </Typography>
          <Typography
            variant="h5"
            paragraph
            sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
          >
            {t('landing:subtitle')}
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {t('landing:ctaLogin')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleTryCalculator}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {t('landing:ctaCalculator')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CalculateIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                {t('landing:feature1Title')}
              </Typography>
              <Typography color="text.secondary">
                {t('landing:feature1Description')}
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                {t('landing:feature2Title')}
              </Typography>
              <Typography color="text.secondary">
                {t('landing:feature2Description')}
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'info.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <AssessmentIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                {t('landing:feature3Title')}
              </Typography>
              <Typography color="text.secondary">
                {t('landing:feature3Description')}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Investment Calculator Section */}
      <Box ref={calculatorRef} sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="md">
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('investment-calculator:saveSuccess')}
            </Alert>
          )}

          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h2" gutterBottom fontWeight={700}>
              {t('investment-calculator:title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('investment-calculator:subtitle')}
            </Typography>
          </Box>

          <Card sx={{ p: 4 }}>
            <InvestmentCalculatorForm onCalculate={handleCalculate} />
            <InvestmentCalculatorResults
              results={results}
              onSave={handleSave}
              showSaveButton={true}
            />
          </Card>
        </Container>
      </Box>

      <LoginDialog open={loginDialogOpen} onClose={handleCloseLoginDialog} />
    </Box>
  );
}

export default withTranslation(["landing"])(LandingPage);
