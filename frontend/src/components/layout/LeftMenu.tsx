import { styled } from "@mui/material/styles";
import { Divider, IconButton, Toolbar } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MuiDrawer from "@mui/material/Drawer";
import LeftMenuItems from "./LeftMenuItems";

const drawerWidth: number = 240;
const collapsedWidth: number = 72;

const StyledDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: collapsedWidth,
    }),
  },
}));

interface LeftMenuProps {
  open: boolean;
  onToggleDrawer: () => void;
  isMobile?: boolean;
}

function LeftMenu({ open, onToggleDrawer, isMobile = false }: LeftMenuProps) {
  if (isMobile) {
    // Mobile: Temporary drawer overlay, no permanent sidebar
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
            justifyContent: "flex-end",
            px: [1],
          }}
        >
          <IconButton onClick={onToggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <LeftMenuItems open={true} isMobile={true} />
      </MuiDrawer>
    );
  }

  // Desktop: Collapsible permanent drawer
  return (
    <StyledDrawer variant="permanent" open={open}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: [1],
        }}
      >
        <IconButton onClick={onToggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <LeftMenuItems open={open} isMobile={false} />
    </StyledDrawer>
  );
}

export default LeftMenu;
