import { WithTranslation, withTranslation } from "react-i18next";
import { styled, useTheme } from "@mui/material/styles";
import {
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import React from "react";
import LanguageSelector from "./LanguageSelector";
import LeftMenu from "./LeftMenu";
import UserMenu from "./UserMenu";
import SettingsMenu from "./SettingsMenu";
import AdminMenu from "../admin/AdminMenu";
import AppName from "./AppName.tsx";
import PropertyBadge from "./PropertyBadge.tsx";
import MobileMoreMenu from "./MobileMoreMenu";

const drawerWidth: number = 240;
const collapsedWidth: number = 72;

interface StyledAppBarProps extends MuiAppBarProps {
  open?: boolean;
  isMobile?: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isMobile",
})<StyledAppBarProps>(({ theme, open, isMobile }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // Mobile: Full width, no offset
  ...(isMobile && {
    marginLeft: 0,
    width: "100%",
  }),
  // Desktop: Offset by full width when open, collapsed width when closed
  ...(!isMobile && {
    marginLeft: open ? drawerWidth : collapsedWidth,
    width: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  }),
}));

function getInitialOpenState() {
  const storedOpen = localStorage.getItem("open");
  return storedOpen !== null ? JSON.parse(storedOpen) : true;
}

function setOpenState(open: boolean) {
  localStorage.setItem("open", JSON.stringify(open));
}

function AppBar({ t }: WithTranslation) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [desktopOpen, setDesktopOpen] = React.useState(getInitialOpenState());
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleDesktopDrawer = () => {
    const newOpenState = !desktopOpen;
    setDesktopOpen(newOpenState);
    setOpenState(newOpenState);
  };

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerOpen = isMobile ? mobileOpen : desktopOpen;
  const toggleDrawer = isMobile ? toggleMobileDrawer : toggleDesktopDrawer;

  return (
    <>
      <CssBaseline />
      <StyledAppBar position="absolute" open={drawerOpen} isMobile={isMobile}>
        <Toolbar
          sx={{
            pr: "24px",
          }}
        >
          {/* Hamburger only on mobile */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "8px",
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box display="flex" flexGrow={0} alignItems="center" gap={2}>
            <AppName t={t} />
            <PropertyBadge />
          </Box>
          <Box flexGrow={1} />
          {isMobile ? (
            <MobileMoreMenu />
          ) : (
            <>
              <LanguageSelector />
              <AdminMenu />
              <SettingsMenu />
              <UserMenu />
            </>
          )}
        </Toolbar>
      </StyledAppBar>
      <LeftMenu
        open={drawerOpen}
        onToggleDrawer={toggleDrawer}
        isMobile={isMobile}
      />
    </>
  );
}

export default withTranslation("appBar")(AppBar);
