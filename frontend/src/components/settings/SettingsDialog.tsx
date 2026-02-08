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
import FullscreenDialogLayout, {
  MenuItem,
} from "../layout/FullscreenDialogLayout";

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

  const menuItems: MenuItem[] = [
    {
      id: SettingsPage.Theme,
      label: t("themeSettings"),
      icon: <PaletteIcon fontSize="small" sx={{ color: "secondary.main" }} />,
    },
    {
      id: SettingsPage.ExpenseTypes,
      label: t("expenseTypes"),
      icon: <PaymentIcon fontSize="small" sx={{ color: "error.main" }} />,
    },
    {
      id: SettingsPage.IncomeTypes,
      label: t("incomeTypes"),
      icon: <MonetizationOnIcon fontSize="small" sx={{ color: "success.main" }} />,
    },
    {
      id: SettingsPage.LoanSettings,
      label: t("loanSettings"),
      icon: <AccountBalanceIcon fontSize="small" sx={{ color: "primary.main" }} />,
    },
  ];

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
    <FullscreenDialogLayout
      open={open}
      onClose={onClose}
      title={t("settings")}
      menuItems={menuItems}
      selectedMenuId={page}
      onMenuSelect={(id) => handleMenuClick(id as SettingsPage)}
    >
      {getContent()}
    </FullscreenDialogLayout>
  );
}

export default withTranslation(settingsContext.name)(SettingsDialog);
