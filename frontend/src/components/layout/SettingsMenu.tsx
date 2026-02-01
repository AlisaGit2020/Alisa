import { settingsContext } from "@alisa-lib/alisa-contexts";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, IconButton, Tooltip } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useState } from "react";
import SettingsDialog from "../settings/SettingsDialog";

function SettingsMenu({ t }: WithTranslation) {
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

export default withTranslation(settingsContext.name)(SettingsMenu);
