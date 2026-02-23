import { adminContext } from "@asset-lib/asset-contexts";
import AdminSharpIcon from "@mui/icons-material/AdminPanelSettings";
import { Box, IconButton, Tooltip } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import AdminDialog from "./AdminDialog";
import ApiClient from "@asset-lib/api-client";

function AdminMenu({ t }: WithTranslation) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await ApiClient.me();
        setIsAdmin(user.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  if (!isAdmin) {
    return null;
  }

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Tooltip title={t("title")}>
        <IconButton color="inherit" onClick={handleOpen}>
          <AdminSharpIcon />
        </IconButton>
      </Tooltip>
      <AdminDialog open={open} onClose={handleClose} />
    </Box>
  );
}

export default withTranslation(adminContext.name)(AdminMenu);
