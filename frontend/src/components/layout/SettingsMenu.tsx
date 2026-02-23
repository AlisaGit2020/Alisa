import SettingsIcon from "@mui/icons-material/Settings";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import SettingsDialog from "../settings/SettingsDialog";

function SettingsMenu() {
  const { t } = useTranslation("settings");
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Tooltip title={t("settings")}>
        <IconButton color="inherit" onClick={handleOpen}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <SettingsDialog open={open} onClose={handleClose} />
    </Box>
  );
}

export default SettingsMenu;
