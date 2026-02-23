import React from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Tooltip } from "@mui/material";
import LanguageMenu, { getFlag } from "./LanguageMenu";

function LanguageSelector() {
  const { t, i18n } = useTranslation("appBar");

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Tooltip title={t("selectLanguage")}>
        <IconButton
          id="open-language-menu"
          aria-controls={open ? "language-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleOpen}
        >
          <img width={24} src={getFlag(i18n.language)} alt="" />
        </IconButton>
      </Tooltip>
      <LanguageMenu anchorEl={anchorEl} open={open} onClose={handleClose} />
    </Box>
  );
}

export default LanguageSelector;
