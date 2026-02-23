import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import ApiClient from "@asset-lib/api-client";
import { User } from "@asset-types";
import { emptyUser } from "@asset-lib/initial-data";
import SettingsDialog from "../settings/SettingsDialog";
import AdminDialog from "../admin/AdminDialog";
import UserDetails from "../user/UserDetails";
import FeedbackDialog from "../feedback/FeedbackDialog";
import { useSignOutWithCleanup } from "@asset-lib/use-sign-out-with-cleanup";
import LanguageMenu from "./LanguageMenu";

function MobileMoreMenu() {
  const { t } = useTranslation("appBar");
  const signOut = useSignOutWithCleanup();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] =
    useState<null | HTMLElement>(null);
  const [, setUser] = useState<User>(emptyUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const menuOpen = Boolean(anchorEl);
  const languageMenuOpen = Boolean(languageAnchorEl);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await ApiClient.me();
        setUser(userData);
        setIsAdmin(userData.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    };
    fetchUser();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = () => {
    handleLanguageMenuClose();
    handleMenuClose();
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };

  const handleFeedbackClick = () => {
    setFeedbackOpen(true);
    handleMenuClose();
  };

  const handleAdminClick = () => {
    setAdminOpen(true);
    handleMenuClose();
  };

  const handleProfileClick = () => {
    setUserDetailsOpen(true);
    handleMenuClose();
  };

  const handleSignOut = () => {
    signOut();
  };


  return (
    <Box>
      <IconButton
        color="inherit"
        aria-label={t("more")}
        aria-controls={menuOpen ? "mobile-more-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
        onClick={handleMenuOpen}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        id="mobile-more-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleLanguageMenuOpen}>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText primary={t("language")} />
        </MenuItem>

        <MenuItem onClick={handleFeedbackClick}>
          <ListItemIcon>
            <FeedbackIcon />
          </ListItemIcon>
          <ListItemText primary={t("common:feedback.title")} />
        </MenuItem>

        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={t("settings")} />
        </MenuItem>

        {isAdmin && (
          <MenuItem onClick={handleAdminClick}>
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t("admin")} />
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonOutlineIcon />
          </ListItemIcon>
          <ListItemText primary={t("profile")} />
        </MenuItem>

        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t("signOut")} />
        </MenuItem>
      </Menu>

      <LanguageMenu
        anchorEl={languageAnchorEl}
        open={languageMenuOpen}
        onClose={handleLanguageChange}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} />
      <UserDetails open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </Box>
  );
}

export default MobileMoreMenu;
