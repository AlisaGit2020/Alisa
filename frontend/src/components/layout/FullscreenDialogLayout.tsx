import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface FullscreenDialogLayoutProps {
  open: boolean;
  onClose: () => void;
  title: string;
  menuItems: MenuItem[];
  selectedMenuId: string;
  onMenuSelect: (id: string) => void;
  children: React.ReactNode;
}

const MENU_WIDTH_EXPANDED = 200;
const MENU_WIDTH_COLLAPSED = 56;

const CollapsiblePaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "menuOpen",
})<{ menuOpen?: boolean }>(({ theme, menuOpen }) => ({
  width: menuOpen ? MENU_WIDTH_EXPANDED : MENU_WIDTH_COLLAPSED,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: menuOpen
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  whiteSpace: "nowrap",
}));

function FullscreenDialogLayout({
  open,
  onClose,
  title,
  menuItems,
  selectedMenuId,
  onMenuSelect,
  children,
}: FullscreenDialogLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [fullscreen, setFullscreen] = useState(true);
  // Desktop: expanded by default. Mobile: collapsed by default
  const [menuOpen, setMenuOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = (id: string) => {
    onMenuSelect(id);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setMenuOpen(!menuOpen);
    }
  };

  // Desktop: Collapsible menu sidebar
  const desktopMenuSidebar = (
    <CollapsiblePaper menuOpen={menuOpen}>
      <Box
        sx={{
          p: 1,
          display: "flex",
          justifyContent: menuOpen ? "flex-end" : "center",
        }}
      >
        <IconButton onClick={toggleMenu} size="small">
          {menuOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <List component="nav" sx={{ pt: 0 }}>
        {menuItems.map((item) => {
          const button = (
            <ListItemButton
              key={item.id}
              selected={selectedMenuId === item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenuClick(item.id);
              }}
              sx={{
                justifyContent: menuOpen ? "flex-start" : "center",
                px: menuOpen ? 2 : 1,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: menuOpen ? 40 : "auto",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {menuOpen && <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          if (!menuOpen) {
            return (
              <Tooltip key={item.id} title={item.label} placement="right">
                {button}
              </Tooltip>
            );
          }

          return button;
        })}
      </List>
    </CollapsiblePaper>
  );

  // Mobile: Collapsed icons sidebar (always visible)
  const mobileCollapsedSidebar = (
    <Paper sx={{ width: MENU_WIDTH_COLLAPSED, flexShrink: 0 }}>
      <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
        <IconButton onClick={toggleMenu} size="small">
          <MenuIcon />
        </IconButton>
      </Box>
      <List component="nav" sx={{ pt: 0 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.id} title={item.label} placement="right">
            <ListItemButton
              selected={selectedMenuId === item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenuClick(item.id);
              }}
              sx={{ justifyContent: "center", px: 1 }}
            >
              <ListItemIcon sx={{ minWidth: "auto" }}>
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Paper>
  );

  // Mobile: Expanded menu overlay drawer
  const mobileMenuOverlay = (
    <Drawer
      variant="temporary"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: MENU_WIDTH_EXPANDED,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 1, display: "flex", justifyContent: "flex-end" }}>
        <IconButton onClick={() => setMobileMenuOpen(false)} size="small">
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <List component="nav">
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedMenuId === item.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMenuClick(item.id);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={fullscreen}
      PaperProps={{
        sx: fullscreen
          ? {}
          : {
              width: "85vw",
              height: "70vh",
              maxWidth: "1200px",
              maxHeight: "700px",
            },
      }}
    >
      <DialogTitle>
        <Box sx={{ ml: 0 }}>{title}</Box>
        <IconButton
          aria-label="toggle fullscreen"
          onClick={() => setFullscreen(!fullscreen)}
          sx={{
            position: "absolute",
            right: 48,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", gap: 0, p: 2, overflow: "hidden" }}>
        {isMobile ? (
          <>
            {mobileCollapsedSidebar}
            {mobileMenuOverlay}
          </>
        ) : (
          desktopMenuSidebar
        )}
        <Box sx={{ flex: 1, overflow: "auto", pl: 2 }}>{children}</Box>
      </DialogContent>
    </Dialog>
  );
}

export default FullscreenDialogLayout;
