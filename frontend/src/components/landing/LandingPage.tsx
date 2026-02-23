import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, Container, Grid, SvgIconProps, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { AssetButton, useAssetToast } from "../asset";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssessmentIcon from "@mui/icons-material/Assessment";
import React from "react";
import LoginDialog from "../login/LoginDialog";
import LandingHeader from "./LandingHeader";
import PricingSection from "./PricingSection";
import InvestmentCalculatorForm from "../investment-calculator/InvestmentCalculatorForm";
import { PageMeta } from "../seo/PageMeta";

interface FeatureConfig {
  icon: React.ComponentType<SvgIconProps>;
  bgcolor: string;
  titleKey: string;
  descriptionKey: string;
}

const features: FeatureConfig[] = [
  { icon: WorkIcon, bgcolor: 'secondary.main', titleKey: 'landing:feature1Title', descriptionKey: 'landing:feature1Description' },
  { icon: DashboardIcon, bgcolor: 'info.main', titleKey: 'landing:feature2Title', descriptionKey: 'landing:feature2Description' },
  { icon: AccountBalanceIcon, bgcolor: 'primary.main', titleKey: 'landing:feature3Title', descriptionKey: 'landing:feature3Description' },
  { icon: AssessmentIcon, bgcolor: 'warning.main', titleKey: 'landing:feature4Title', descriptionKey: 'landing:feature4Description' },
];

function LandingPage({ t }: WithTranslation) {
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);
  const [searchParams] = useSearchParams();
  const { showToast } = useAssetToast();

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

  const handleAfterSubmit = () => {
    // Show login dialog after save attempt (for anonymous users, they need to log in)
    setLoginDialogOpen(true);
  };

  const handleCancel = () => {
    setFormKey(prev => prev + 1);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageMeta
        titleKey="landing.title"
        descriptionKey="landing.description"
        path="/"
      />
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
            <AssetButton
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
            <AssetButton
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
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
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
                      bgcolor: feature.bgcolor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Icon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                    {t(feature.titleKey)}
                  </Typography>
                  <Typography color="text.secondary">
                    {t(feature.descriptionKey)}
                  </Typography>
                </Card>
              </Grid>
            );
          })}
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
            <InvestmentCalculatorForm
              key={formKey}
              onCancel={handleCancel}
              onAfterSubmit={handleAfterSubmit}
            />
          </Card>
        </Container>
      </Box>

      <LoginDialog open={loginDialogOpen} onClose={handleCloseLoginDialog} />
    </Box>
  );
}

export default withTranslation(["landing"])(LandingPage);
