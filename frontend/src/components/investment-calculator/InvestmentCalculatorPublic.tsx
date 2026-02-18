import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Container, Link, Typography } from "@mui/material";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import InvestmentCalculatorForm from "./InvestmentCalculatorForm";
import LoginDialog from "../login/LoginDialog";
import { useTranslation } from "react-i18next";
import { useToast } from "../alisa";

function InvestmentCalculatorPublic({ t }: WithTranslation) {
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);
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

  const handleAfterSubmit = () => {
    if (!isAuthenticated) {
      // Show login dialog if not authenticated
      setLoginDialogOpen(true);
      return;
    }
    // Reset form after save
    setFormKey(prev => prev + 1);
    showToast({ message: t("common:toast.calculationSaved"), severity: "success" });
  };

  const handleCancel = () => {
    setFormKey(prev => prev + 1);
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
            <InvestmentCalculatorForm
              key={formKey}
              onCancel={handleCancel}
              onAfterSubmit={handleAfterSubmit}
            />
          </Box>
        </Container>
      </Box>

      <LoginDialog open={loginDialogOpen} onClose={handleCloseLoginDialog} />
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorPublic);
