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
import PaletteIcon from "@mui/icons-material/Palette";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { WithTranslation, withTranslation } from "react-i18next";
import { useState } from "react";
import LoanSettings from "./loan-settings/LoanSettings";
import ThemeSettings from "./theme/ThemeSettings";
import ExpenseTypes from "./expense-type/ExpenseTypes";
import ExpenseTypeForm from "./expense-type/ExpenseTypeForm";
import IncomeTypes from "./income-type/IncomeTypes";
import IncomeTypeForm from "./income-type/IncomeTypeForm";
import { settingsContext } from "@alisa-lib/alisa-contexts";

enum SettingsPage {
  Theme = "theme",
  LoanSettings = "loan-settings",
  ExpenseTypes = "expense-types",
  IncomeTypes = "income-types",
}

enum Action {
  List = "list",
  Add = "add",
  Edit = "edit",
}

interface SettingsDialogProps extends WithTranslation {
  open: boolean;
  onClose: () => void;
}

function SettingsDialog({ t, open, onClose }: SettingsDialogProps) {
  const [page, setPage] = useState<SettingsPage>(SettingsPage.Theme);
  const [action, setAction] = useState<Action>(Action.List);
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const handleMenuClick = (selectedPage: SettingsPage) => {
    setPage(selectedPage);
    setAction(Action.List);
    setEditId(undefined);
  };

  const handleAdd = () => {
    setAction(Action.Add);
    setEditId(undefined);
  };

  const handleEdit = (id: number) => {
    setAction(Action.Edit);
    setEditId(id);
  };

  const handleBackToList = () => {
    setAction(Action.List);
    setEditId(undefined);
    setRefreshTrigger((prev) => prev + 1);
  };

  const getContent = () => {
    switch (page) {
      case SettingsPage.Theme:
        return <ThemeSettings />;
      case SettingsPage.LoanSettings:
        return <LoanSettings />;
      case SettingsPage.ExpenseTypes:
        if (action === Action.Add) {
          return (
            <ExpenseTypeForm
              onCancel={handleBackToList}
              onAfterSubmit={handleBackToList}
            />
          );
        }
        if (action === Action.Edit && editId) {
          return (
            <ExpenseTypeForm
              id={editId}
              onCancel={handleBackToList}
              onAfterSubmit={handleBackToList}
            />
          );
        }
        return (
          <ExpenseTypes
            onAdd={handleAdd}
            onEdit={handleEdit}
            key={refreshTrigger}
          />
        );
      case SettingsPage.IncomeTypes:
        if (action === Action.Add) {
          return (
            <IncomeTypeForm
              onCancel={handleBackToList}
              onAfterSubmit={handleBackToList}
            />
          );
        }
        if (action === Action.Edit && editId) {
          return (
            <IncomeTypeForm
              id={editId}
              onCancel={handleBackToList}
              onAfterSubmit={handleBackToList}
            />
          );
        }
        return (
          <IncomeTypes
            onAdd={handleAdd}
            onEdit={handleEdit}
            key={refreshTrigger}
          />
        );
      default:
        return <ThemeSettings />;
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
        {t("settings")}
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
              selected={page === SettingsPage.Theme}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuClick(SettingsPage.Theme); }}
            >
              <ListItemIcon>
                <PaletteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("themeSettings")} />
            </ListItemButton>
            <ListItemButton
              selected={page === SettingsPage.ExpenseTypes}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuClick(SettingsPage.ExpenseTypes); }}
            >
              <ListItemIcon>
                <PaymentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("expenseTypes")} />
            </ListItemButton>
            <ListItemButton
              selected={page === SettingsPage.IncomeTypes}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuClick(SettingsPage.IncomeTypes); }}
            >
              <ListItemIcon>
                <MonetizationOnIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("incomeTypes")} />
            </ListItemButton>
            <ListItemButton
              selected={page === SettingsPage.LoanSettings}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuClick(SettingsPage.LoanSettings); }}
            >
              <ListItemIcon>
                <AccountBalanceIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("loanSettings")} />
            </ListItemButton>
          </List>
        </Paper>
        <Box sx={{ flex: 1, overflow: "auto" }}>{getContent()}</Box>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(settingsContext.name)(SettingsDialog);
