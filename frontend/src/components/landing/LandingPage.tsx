import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, Container, Grid, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { AlisaButton, useToast } from "../alisa";
import CalculateIcon from "@mui/icons-material/Calculate";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssessmentIcon from "@mui/icons-material/Assessment";
import React from "react";
import LoginDialog from "../login/LoginDialog";
import LandingHeader from "./LandingHeader";
import PricingSection from "./PricingSection";
import InvestmentCalculatorForm, { InvestmentInputData } from "../investment-calculator/InvestmentCalculatorForm";
import InvestmentCalculatorResults, { InvestmentResults } from "../investment-calculator/InvestmentCalculatorResults";
import ApiClient from "@alisa-lib/api-client";

function LandingPage({ t }: WithTranslation) {
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [results, setResults] = React.useState<InvestmentResults | null>(null);
  const [inputData, setInputData] = React.useState<InvestmentInputData | null>(null);
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  React.useEffect(() => {
    // Check if we just saved successfully (coming back from login)
    if (searchParams.get('saved') === 'true') {
      showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
    }
  }, [searchParams, showToast, t]);

  const handleLogin = () => {
    setLoginDialogOpen(true);
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

  const handleTryCalculator = () => {
    const element = document.getElementById('calculator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCalculate = async (data: InvestmentInputData) => {
    try {
      setInputData(data);
      // Use 'unknown' as input type since the response type differs from input type
      const response = await ApiClient.post<unknown>(
        'real-estate/investment/calculate',
        data,
        true
      );
      const responseData = response as InvestmentResults | { data: InvestmentResults };
      if ('data' in responseData) {
        setResults(responseData.data);
      } else {
        setResults(responseData);
      }
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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header */}
      <LandingHeader onLoginClick={handleLogin} />

      {/* Hero Section */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #1a2744 0%, #2d3d5c 100%)'
              : 'linear-gradient(135deg, #0f1a2e 0%, #1a2744 100%)',
          color: 'white',
          pt: { xs: 10, md: 8 },
          pb: { xs: 6, md: 12 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', pt: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}>
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
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', px: { xs: 2, sm: 0 } }}>
            <AlisaButton
              label={t('landing:ctaLogin')}
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            />
            <AlisaButton
              label={t('landing:ctaCalculator')}
              variant="outlined"
              size="large"
              onClick={handleTryCalculator}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container id="features" maxWidth="lg" sx={{ mt: { xs: 4, md: 8 }, mb: { xs: 6, md: 12 }, scrollMarginTop: '80px', px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: { xs: 3, md: 6 }, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            fontWeight={700}
            sx={{ fontSize: { xs: '1.75rem', md: '3rem' } }}
          >
            {t('landing:featuresTitle')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            {t('landing:featuresSubtitle')}
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 3, md: 6 }}>
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
                  bgcolor: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CalculateIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                  bgcolor: 'primary.main',
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
                  bgcolor: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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

      {/* Pricing Section */}
      <PricingSection onLoginClick={handleLogin} />

      {/* Investment Calculator Section */}
      <Box id="calculator" sx={{ bgcolor: 'background.paper', py: { xs: 4, md: 8 }, scrollMarginTop: '80px' }}>
        <Container maxWidth="md">
          <Box sx={{ mb: { xs: 2, md: 4 }, textAlign: 'center', px: { xs: 1, md: 0 } }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              fontWeight={700}
              sx={{ fontSize: { xs: '1.75rem', md: '3rem' } }}
            >
              {t('investment-calculator:title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('investment-calculator:subtitle')}
            </Typography>
          </Box>

          <Card sx={{ p: { xs: 2, md: 4 } }}>
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
