import { WithTranslation, withTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { Box, CssBaseline, Divider, IconButton, Paper, Toolbar, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import LeftMenuItems from './LeftMenuItems';
import React from 'react';
import LanguageSelector from './LanguageSelector';

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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

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

        </Toolbar>
      </_AppBar >
      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />

        <LeftMenuItems></LeftMenuItems>

      </Drawer>
    </>
  );
}

export default withTranslation('appBar')(AppBar);


