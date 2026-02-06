import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PeopleIcon from "@mui/icons-material/People";
import { WithTranslation, withTranslation } from "react-i18next";
import { useState } from "react";
import AdminUserList from "./users/AdminUserList";
import { adminContext } from "@alisa-lib/alisa-contexts";

enum AdminPage {
  Users = "users",
}

interface AdminDialogProps extends WithTranslation {
  open: boolean;
  onClose: () => void;
}

function AdminDialog({ t, open, onClose }: AdminDialogProps) {
  const [page, setPage] = useState<AdminPage>(AdminPage.Users);
  const [fullscreen, setFullscreen] = useState(false);

  const handleMenuClick = (selectedPage: AdminPage) => {
    setPage(selectedPage);
  };

  const getContent = () => {
    switch (page) {
      case AdminPage.Users:
        return <AdminUserList />;
      default:
        return <AdminUserList />;
    }
  };

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
        {t("title")}
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
      <DialogContent sx={{ display: "flex", gap: 2, p: 2 }}>
        <Paper sx={{ minWidth: 200 }}>
          <List component="nav">
            <ListItemButton
              selected={page === AdminPage.Users}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenuClick(AdminPage.Users);
              }}
            >
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("users")} />
            </ListItemButton>
          </List>
        </Paper>
        <Box sx={{ flex: 1, overflow: "auto" }}>{getContent()}</Box>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(adminContext.name)(AdminDialog);
