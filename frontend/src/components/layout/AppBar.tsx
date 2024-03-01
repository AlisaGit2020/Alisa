import { WithTranslation, withTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { CssBaseline, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import React from 'react';
import LanguageSelector from './LanguageSelector';
import LeftMenu from './LeftMenu';
import UserMenu from './UserMenu';

const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const _AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function getInitialOpenState() {
  // Yritä hakea tallennettu 'open' arvo localStoragesta
  const storedOpen = localStorage.getItem('open');
  // Palauta tallennettu arvo, jos se on määritetty, muuten palauta true
  return storedOpen !== null ? JSON.parse(storedOpen) : true;
}

function setOpenState(open: boolean) {
  // Tallenna 'open' arvo localStorageen
  localStorage.setItem('open', JSON.stringify(open));
}

function AppBar({ t }: WithTranslation) {
  const [open, setOpen] = React.useState(getInitialOpenState());

  const toggleDrawer = () => {
    const newOpenState = !open;
    setOpen(newOpenState);
    setOpenState(newOpenState);
  };

  return (
    <>
      <CssBaseline />
      <_AppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >

          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {t('title')}
          </Typography>

          <LanguageSelector></LanguageSelector>
          <Tooltip title={t('settings')}>
            <IconButton
              color="inherit"
              href='/settings'
            ><SettingsIcon></SettingsIcon>
            </IconButton>
          </Tooltip>
          <UserMenu></UserMenu>

        </Toolbar>
      </_AppBar >
      <LeftMenu open={open} onToggleDrawer={toggleDrawer}></LeftMenu>
    </>
  );
}

export default withTranslation('appBar')(AppBar);


