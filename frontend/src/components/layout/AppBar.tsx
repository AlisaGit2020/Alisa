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
import AdminMenu from "../admin/AdminMenu";
import PropertyBadge from "./PropertyBadge.tsx";
import MobileMoreMenu from "./MobileMoreMenu";

const drawerWidth: number = 240;

interface StyledAppBarProps extends MuiAppBarProps {
  isMobile?: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "isMobile",
})<StyledAppBarProps>(({ theme, isMobile }) => ({
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
  // Desktop: Always offset by full drawer width (menu always open)
  ...(!isMobile && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

function AppBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <CssBaseline />
      <StyledAppBar position="absolute" isMobile={isMobile}>
        <Toolbar
          sx={{
            pr: "24px",
          }}
        >
          {/* Mobile: Logo that opens drawer */}
          {isMobile && (
            <Box
              component="img"
              src="/assets/asset-logo-white.png"
              alt="Asset"
              onClick={toggleMobileDrawer}
              sx={{
                height: 32,
                width: "auto",
                marginRight: "8px",
                cursor: "pointer",
              }}
            />
          )}
          <Box display="flex" flexGrow={0} alignItems="center" gap={2}>
            {/* Desktop: Show logo in AppBar */}
            {!isMobile && (
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
                  src="/assets/asset-logo-white.png"
                  alt="Asset"
                  sx={{
                    height: 40,
                    width: "auto",
                  }}
                />
              </Box>
            )}
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
        open={isMobile ? mobileOpen : true}
        onToggleDrawer={toggleMobileDrawer}
        isMobile={isMobile}
      />
    </>
  );
}

export default AppBar;
