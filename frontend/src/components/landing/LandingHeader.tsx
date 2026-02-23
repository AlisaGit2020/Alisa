import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Container, Toolbar, Link, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import React from "react";
import { AssetButton } from "../asset";

interface LandingHeaderProps extends WithTranslation {
  onLoginClick: () => void;
}

function LandingHeader({ t, onLoginClick }: LandingHeaderProps) {
  const { i18n } = useTranslation();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const navLinkStyles = {
    color: 'text.primary',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    px: 1,
    py: 0.5,
    borderRadius: 1,
    '&:hover': {
      opacity: 0.8,
    },
  };

  const langLinkStyles = (isActive: boolean) => ({
    color: 'text.secondary',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 400,
    opacity: isActive ? 1 : 0.7,
    cursor: 'pointer',
    fontSize: '0.875rem',
    px: 0.5,
    py: 0.25,
    borderRadius: 0.5,
    '&:hover': {
      opacity: 1,
    },
  });

  return (
    <MuiAppBar
      position="fixed"
      elevation={scrolled ? 2 : 1}
      sx={{
        backgroundColor: 'background.paper',
        transition: 'box-shadow 0.3s',
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

          {/* Navigation Links - Hidden on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4 }}>
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

          {/* Language Selector - Hidden on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            <Link
              component="button"
              onClick={() => changeLanguage('fi')}
              sx={langLinkStyles(i18n.language === 'fi')}
            >
              FI
            </Link>
            <Box sx={{ color: 'text.secondary', opacity: 0.5 }}>|</Box>
            <Link
              component="button"
              onClick={() => changeLanguage('sv')}
              sx={langLinkStyles(i18n.language === 'sv')}
            >
              SV
            </Link>
            <Box sx={{ color: 'text.secondary', opacity: 0.5 }}>|</Box>
            <Link
              component="button"
              onClick={() => changeLanguage('en')}
              sx={langLinkStyles(i18n.language === 'en')}
            >
              EN
            </Link>
          </Box>

          {/* Login Button - Hidden on mobile */}
          <AssetButton
            label={t('landing:nav.login')}
            variant="contained"
            onClick={onLoginClick}
            sx={{
              display: { xs: 'none', md: 'flex' },
              ml: 2,
            }}
          />

          {/* Mobile Menu Button */}
          <IconButton
            onClick={handleMobileMenuToggle}
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: 'text.primary',
            }}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={handleMobileMenuClose} aria-label="close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => scrollToSection('features')}>
              <ListItemText primary={t('landing:nav.features')} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => scrollToSection('pricing')}>
              <ListItemText primary={t('landing:nav.pricing')} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => scrollToSection('calculator')}>
              <ListItemText primary={t('landing:nav.calculator')} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
            <Link
              component="button"
              onClick={() => changeLanguage('fi')}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: i18n.language === 'fi' ? 700 : 400,
                opacity: i18n.language === 'fi' ? 1 : 0.7,
              }}
            >
              FI
            </Link>
            <Link
              component="button"
              onClick={() => changeLanguage('sv')}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: i18n.language === 'sv' ? 700 : 400,
                opacity: i18n.language === 'sv' ? 1 : 0.7,
              }}
            >
              SV
            </Link>
            <Link
              component="button"
              onClick={() => changeLanguage('en')}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: i18n.language === 'en' ? 700 : 400,
                opacity: i18n.language === 'en' ? 1 : 0.7,
              }}
            >
              EN
            </Link>
          </Box>
          <AssetButton
            label={t('landing:nav.login')}
            variant="contained"
            fullWidth
            onClick={() => {
              handleMobileMenuClose();
              onLoginClick();
            }}
          />
        </Box>
      </Drawer>
    </MuiAppBar>
  );
}

export default withTranslation(["landing"])(LandingHeader);
