import { styled } from "@mui/material/styles";
import { Box, Divider, IconButton, Toolbar, Tooltip } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MuiDrawer from "@mui/material/Drawer";
import LeftMenuItems from "./LeftMenuItems";
import { useTranslation } from "react-i18next";

const drawerWidth: number = 240;

const StyledDrawer = styled(MuiDrawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    boxSizing: "border-box",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
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
              src="/assets/asset-logo.png"
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
        <LeftMenuItems open={true} isMobile={true} />
      </MuiDrawer>
    );
  }

  // Desktop: Permanent drawer, always open, no toggle button
  return (
    <StyledDrawer variant="permanent" open={true}>
      <Toolbar />
      <LeftMenuItems open={true} isMobile={false} />
    </StyledDrawer>
  );
}

export default LeftMenu;
