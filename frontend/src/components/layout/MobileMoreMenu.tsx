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
  Avatar,
  styled,
  Stack,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import CheckIcon from "@mui/icons-material/Check";
import ApiClient from "@alisa-lib/api-client";
import { User } from "@alisa-types";
import { emptyUser } from "@alisa-lib/initial-data";
import SettingsDialog from "../settings/SettingsDialog";
import AdminDialog from "../admin/AdminDialog";
import UserDetails from "../user/UserDetails";
import FeedbackDialog from "../feedback/FeedbackDialog";
import { useSignOutWithCleanup } from "@alisa-lib/use-sign-out-with-cleanup";

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  border: `1px solid ${theme.palette.background.paper}`,
}));

const getFlag = (language: string) => {
  if (language === "fi") {
    return "/assets/flags/finland-48.png";
  }
  if (language === "en") {
    return "/assets/flags/great-britain-48.png";
  }
};

function MobileMoreMenu() {
  const { t, i18n } = useTranslation("appBar");
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

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
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

  const getCheckIconVisibility = (language: string): "visible" | "hidden" => {
    return language === i18n.language ? "visible" : "hidden";
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

      <Menu
        id="language-menu"
        anchorEl={languageAnchorEl}
        open={languageMenuOpen}
        onClose={handleLanguageMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => handleLanguageChange("en")}>
          <Stack direction="row" spacing={2}>
            <SmallAvatar src={getFlag("en")} />
            <Box>English</Box>
            <CheckIcon visibility={getCheckIconVisibility("en")} />
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange("fi")}>
          <Stack direction="row" spacing={2}>
            <SmallAvatar src={getFlag("fi")} />
            <Box>Suomi</Box>
            <CheckIcon visibility={getCheckIconVisibility("fi")} />
          </Stack>
        </MenuItem>
      </Menu>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} />
      <UserDetails open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </Box>
  );
}

export default MobileMoreMenu;
