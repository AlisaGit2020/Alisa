import { styled, Theme, CSSObject } from "@mui/material/styles";
import { Box, IconButton, Toolbar, Tooltip, Divider } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MuiDrawer from "@mui/material/Drawer";
import LeftMenuItems from "./LeftMenuItems";
import { useTranslation } from "react-i18next";
import { LOGO_DARK } from "@alisa-lib/constants";

const drawerWidth: number = 240;
const collapsedDrawerWidth: number = 72;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  width: collapsedDrawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
});

interface StyledDrawerProps {
  open?: boolean;
}

const StyledDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<StyledDrawerProps>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": {
      ...openedMixin(theme),
      position: "relative",
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": {
      ...closedMixin(theme),
      position: "relative",
    },
  }),
}));

interface LeftMenuProps {
  open: boolean;
  onToggleDrawer: () => void;
  isMobile?: boolean;
}

function LeftMenu({ open, onToggleDrawer, isMobile = false }: LeftMenuProps) {
  const { t } = useTranslation("menu");

  if (isMobile) {
    // Mobile: Temporary drawer overlay
    return (
      <MuiDrawer
        variant="temporary"
        open={open}
        onClose={onToggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: [1],
          }}
        >
          {/* Logo in mobile drawer */}
          <Box
            component="a"
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              pl: 1,
            }}
          >
            <Box
              component="img"
              src={LOGO_DARK}
              alt="Asset"
              sx={{
                height: 32,
                width: "auto",
              }}
            />
          </Box>
          <Tooltip title={t("collapseMenu")}>
            <IconButton onClick={onToggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        <LeftMenuItems open={true} />
      </MuiDrawer>
    );
  }

  // Desktop: Permanent drawer with collapse/expand toggle
  return (
    <StyledDrawer variant="permanent" open={open}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: open ? "flex-end" : "center",
          minHeight: 64,
        }}
      >
        <Tooltip title={open ? t("collapseMenu") : t("expandMenu")}>
          <IconButton onClick={onToggleDrawer} size="small">
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <LeftMenuItems open={open} />
    </StyledDrawer>
  );
}

export default LeftMenu;
