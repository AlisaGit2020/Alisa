import { styled, useTheme } from "@mui/material/styles";
import {
  Box,
  CssBaseline,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import React from "react";
import LanguageSelector from "./LanguageSelector";
import LeftMenu from "./LeftMenu";
import UserMenu from "./UserMenu";
import SettingsMenu from "./SettingsMenu";
import FeedbackMenuButton from "./FeedbackMenuButton";
import AdminMenu from "../admin/AdminMenu";
import PropertyBadge from "./PropertyBadge.tsx";
import MobileMoreMenu from "./MobileMoreMenu";
import { LOGO_WHITE, DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from "@asset-lib/constants";

interface StyledAppBarProps extends MuiAppBarProps {
  isMobile?: boolean;
  drawerOpen?: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "isMobile" && prop !== "drawerOpen",
})<StyledAppBarProps>(({ theme, isMobile, drawerOpen }) => ({
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
  // Desktop: Offset based on drawer state
  ...(!isMobile && {
    marginLeft: drawerOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    width: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`,
  }),
}));

function AppBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(() => {
    const saved = localStorage.getItem("menuExpanded");
    return saved === "true";
  });

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDesktopDrawer = () => {
    const newState = !desktopOpen;
    setDesktopOpen(newState);
    localStorage.setItem("menuExpanded", String(newState));
  };

  return (
    <>
      <CssBaseline />
      <StyledAppBar position="absolute" isMobile={isMobile} drawerOpen={desktopOpen}>
        <Toolbar
          sx={{
            pr: "24px",
          }}
        >
          {isMobile ? (
            <>
              {/* Mobile: Logo left, PropertyBadge centered, Menu right */}
              <Box
                component="img"
                src={LOGO_WHITE}
                alt="Asset"
                onClick={toggleMobileDrawer}
                sx={{
                  height: 32,
                  width: "auto",
                  cursor: "pointer",
                }}
              />
              <Box flexGrow={1} />
              <PropertyBadge />
              <Box flexGrow={1} />
              <MobileMoreMenu />
            </>
          ) : (
            <>
              {/* Desktop: Logo and PropertyBadge on left, menus on right */}
              <Box display="flex" flexGrow={0} alignItems="center" gap={2}>
                <Box
                  component="a"
                  href="/"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  <Box
                    component="img"
                    src={LOGO_WHITE}
                    alt="Asset"
                    sx={{
                      height: 40,
                      width: "auto",
                    }}
                  />
                </Box>
                <PropertyBadge />
              </Box>
              <Box flexGrow={1} />
              <LanguageSelector />
              <FeedbackMenuButton />
              <AdminMenu />
              <SettingsMenu />
              <UserMenu />
            </>
          )}
        </Toolbar>
      </StyledAppBar>
      <LeftMenu
        open={isMobile ? mobileOpen : desktopOpen}
        onToggleDrawer={isMobile ? toggleMobileDrawer : toggleDesktopDrawer}
        isMobile={isMobile}
      />
    </>
  );
}

export default AppBar;
