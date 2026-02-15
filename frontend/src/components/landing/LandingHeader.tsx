import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Container, Toolbar, Link } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import { useTranslation } from "react-i18next";
import React from "react";
import { AlisaButton } from "../alisa";

interface LandingHeaderProps extends WithTranslation {
  onLoginClick: () => void;
}

function LandingHeader({ t, onLoginClick }: LandingHeaderProps) {
  const { i18n } = useTranslation();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const navLinkStyles = {
    color: scrolled ? 'text.primary' : 'white',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 0.8,
    },
  };

  const langLinkStyles = (isActive: boolean) => ({
    color: scrolled ? 'text.secondary' : 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 400,
    opacity: isActive ? 1 : 0.7,
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:hover': {
      opacity: 1,
    },
  });

  return (
    <MuiAppBar
      position="fixed"
      elevation={scrolled ? 2 : 0}
      sx={{
        backgroundColor: scrolled
          ? 'background.paper'
          : 'transparent',
        transition: 'background-color 0.3s, box-shadow 0.3s',
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 3 }}>
          {/* Logo */}
          <Box
            component="a"
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <Box
              component="img"
              src="/assets/asset-logo.png"
              alt="Asset"
              sx={{
                height: 40,
                width: 'auto',
              }}
            />
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 3, ml: 4 }}>
            <Link
              component="button"
              onClick={() => scrollToSection('features')}
              sx={navLinkStyles}
            >
              {t('landing:nav.features')}
            </Link>
            <Link
              component="button"
              onClick={() => scrollToSection('pricing')}
              sx={navLinkStyles}
            >
              {t('landing:nav.pricing')}
            </Link>
            <Link
              component="button"
              onClick={() => scrollToSection('calculator')}
              sx={navLinkStyles}
            >
              {t('landing:nav.calculator')}
            </Link>
          </Box>

          <Box flexGrow={1} />

          {/* Language Selector */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Link
              component="button"
              onClick={() => changeLanguage('fi')}
              sx={langLinkStyles(i18n.language === 'fi')}
            >
              FI
            </Link>
            <Box sx={{ color: scrolled ? 'text.secondary' : 'white', opacity: 0.5 }}>|</Box>
            <Link
              component="button"
              onClick={() => changeLanguage('sv')}
              sx={langLinkStyles(i18n.language === 'sv')}
            >
              SV
            </Link>
            <Box sx={{ color: scrolled ? 'text.secondary' : 'white', opacity: 0.5 }}>|</Box>
            <Link
              component="button"
              onClick={() => changeLanguage('en')}
              sx={langLinkStyles(i18n.language === 'en')}
            >
              EN
            </Link>
          </Box>

          {/* Login Button */}
          <AlisaButton
            label={t('landing:nav.login')}
            variant={scrolled ? "contained" : "outlined"}
            onClick={onLoginClick}
            sx={{
              ml: 2,
              borderColor: scrolled ? undefined : 'white',
              color: scrolled ? undefined : 'white',
              '&:hover': {
                borderColor: scrolled ? undefined : 'white',
                bgcolor: scrolled ? undefined : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
}

export default withTranslation(["landing"])(LandingHeader);
