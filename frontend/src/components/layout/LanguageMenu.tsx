import { useTranslation } from "react-i18next";
import { MenuItem, Box, Menu, Fade, styled, Avatar, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import ApiClient from "@alisa-lib/api-client";
import { SupportedLanguage } from "@alisa-types";

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  border: `1px solid ${theme.palette.background.paper}`,
}));

export const getFlag = (language: string): string => {
  if (language === "fi") {
    return "/assets/flags/finland-48.png";
  }
  if (language === "en") {
    return "/assets/flags/great-britain-48.png";
  }
  if (language === "sv") {
    return "/assets/flags/sweden-48.png";
  }
  return "/assets/flags/great-britain-48.png";
};

interface LanguageMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

function LanguageMenu({ anchorEl, open, onClose }: LanguageMenuProps) {
  const { i18n } = useTranslation();
  const isAuthenticated = useIsAuthenticated();

  const changeLanguage = async (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    onClose();

    if (isAuthenticated) {
      try {
        await ApiClient.updateUserSettings({ language });
      } catch (error) {
        console.error("Failed to persist language preference:", error);
      }
    }
  };

  const getCheckIconVisibility = (language: string): "visible" | "hidden" => {
    return language === i18n.language ? "visible" : "hidden";
  };

  const getMenuItem = (language: SupportedLanguage, languageText: string) => {
    return (
      <MenuItem key={language} onClick={() => changeLanguage(language)}>
        <Stack direction="row" spacing={2}>
          <SmallAvatar src={getFlag(language)} />
          <Box>{languageText}</Box>
          <CheckIcon visibility={getCheckIconVisibility(language)} />
        </Stack>
      </MenuItem>
    );
  };

  return (
    <Menu
      id="language-menu"
      MenuListProps={{
        "aria-labelledby": "open-language-menu",
      }}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
    >
      {getMenuItem("en", "English")}
      {getMenuItem("fi", "Suomi")}
      {getMenuItem("sv", "Svenska")}
    </Menu>
  );
}

export default LanguageMenu;
