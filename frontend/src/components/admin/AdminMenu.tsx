import AdminSharpIcon from "@mui/icons-material/AdminPanelSettings";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import AdminDialog from "./AdminDialog";
import { useUser } from "@asset-lib/user-context";
import { UserRole } from "@asset-types";

function AdminMenu() {
  const { t } = useTranslation("admin");
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.roles?.includes(UserRole.ADMIN) ?? false;

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

export default AdminMenu;
