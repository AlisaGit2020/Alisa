import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Container, Toolbar, Typography } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../layout/LanguageSelector";
import SettingsMenu from "../layout/SettingsMenu";
import { AlisaButton } from "../alisa";

function LandingHeader({ t }: WithTranslation) {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="a"
            href="/"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              fontSize: '1.5rem',
            }}
          >
            Alisa
          </Typography>
          <Box flexGrow={1} />
          <LanguageSelector />
          <SettingsMenu />
          <AlisaButton
            label={t('landing:ctaLogin')}
            variant="contained"
            onClick={handleLogin}
            sx={{ ml: 2 }}
          />
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
}

export default withTranslation(["appBar", "landing"])(LandingHeader);
