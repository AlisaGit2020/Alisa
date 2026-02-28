import { ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalculateIcon from "@mui/icons-material/Calculate";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WorkIcon from "@mui/icons-material/Work";
import AssessmentIcon from "@mui/icons-material/Assessment";

export interface SubPageConfig {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: ReactNode;
  routePath: string;
  color: string;
}

export interface MenuItemConfig {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon: ReactNode;
  routePath: string;
  color: string;
  subPages?: SubPageConfig[];
}

// Translation namespaces for each section
export const menuTranslationNamespaces: Record<string, string> = {
  overview: "menu",
  portfolio: "portfolio",
  finance: "finance",
  reports: "reports",
};

export const menuConfig: MenuItemConfig[] = [
  {
    id: "overview",
    titleKey: "overview",
    icon: <DashboardIcon />,
    routePath: "/app/dashboard",
    color: "info.main",
  },
  {
    id: "portfolio",
    titleKey: "portfolio",
    icon: <WorkIcon />,
    routePath: "/app/portfolio/properties/own",
    color: "secondary.main",
  },
  {
    id: "finance",
    titleKey: "finance",
    descriptionKey: "financeDescription",
    icon: <AccountBalanceIcon />,
    routePath: "/app/finance",
    color: "primary.main",
    subPages: [
      {
        id: "bankTransactions",
        titleKey: "bankTransactions",
        descriptionKey: "bankTransactionsDescription",
        icon: <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />,
        routePath: "/app/finance/transactions",
        color: "primary.main",
      },
      {
        id: "incomes",
        titleKey: "incomes",
        descriptionKey: "incomesDescription",
        icon: <PaymentsIcon sx={{ fontSize: 48 }} />,
        routePath: "/app/finance/incomes",
        color: "success.main",
      },
      {
        id: "expenses",
        titleKey: "expenses",
        descriptionKey: "expensesDescription",
        icon: <ReceiptIcon sx={{ fontSize: 48 }} />,
        routePath: "/app/finance/expenses",
        color: "error.main",
      },
    ],
  },
  {
    id: "reports",
    titleKey: "reports",
    descriptionKey: "reportsDescription",
    icon: <AssessmentIcon />,
    routePath: "/app/reports",
    color: "warning.main",
    subPages: [
      {
        id: "propertyReports",
        titleKey: "propertyReports",
        descriptionKey: "propertyReportsDescription",
        icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
        routePath: "/app/reports/property",
        color: "warning.main",
      },
      {
        id: "taxCalculations",
        titleKey: "taxCalculations",
        descriptionKey: "taxCalculationsDescription",
        icon: <CalculateIcon sx={{ fontSize: 48 }} />,
        routePath: "/app/reports/tax",
        color: "warning.main",
      },
    ],
  },
];

// Helper to get menu item by id
export function getMenuItemById(id: string): MenuItemConfig | undefined {
  return menuConfig.find((item) => item.id === id);
}

// Helper to get all sub-pages for a menu item
export function getSubPages(menuId: string): SubPageConfig[] {
  const menuItem = getMenuItemById(menuId);
  return menuItem?.subPages ?? [];
}
