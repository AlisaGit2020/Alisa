import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WorkIcon from "@mui/icons-material/Work";
import AssessmentIcon from "@mui/icons-material/Assessment";

interface MainMenuItemsProps {
  open: boolean;
  isMobile?: boolean;
}

function MainMenuItems({ open }: MainMenuItemsProps) {
  const { t } = useTranslation("menu");
  const currentPath = window.location.pathname;

  const menuItem = (
    id: string,
    href: string,
    label: string,
    icon: ReactNode,
    selected: boolean
  ) => {
    const button = (
      <ListItemButton
        component="a"
        href={href}
        selected={selected}
        sx={{ pl: 2 }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    );

    if (!open) {
      return (
        <Tooltip title={label} placement="right" key={id}>
          {button}
        </Tooltip>
      );
    }

    return <span key={id}>{button}</span>;
  };

  // Check if current path is under a menu section
  const isPortfolioSection = currentPath.startsWith("/app/portfolio");
  const isFinanceSection = currentPath.startsWith("/app/finance");
  const isReportsSection = currentPath.startsWith("/app/reports");

  return (
    <List component="nav">
      {/* 1. Overview */}
      {menuItem(
        "overview",
        "/app/dashboard",
        t("overview"),
        <DashboardIcon sx={{ color: "info.main" }} />,
        currentPath === "/app/dashboard"
      )}

      {/* 2. Portfolio */}
      {menuItem(
        "portfolio",
        "/app/portfolio",
        t("portfolio"),
        <WorkIcon sx={{ color: "secondary.main" }} />,
        isPortfolioSection
      )}

      {/* 3. Finance */}
      {menuItem(
        "finance",
        "/app/finance",
        t("finance"),
        <AccountBalanceIcon sx={{ color: "primary.main" }} />,
        isFinanceSection
      )}

      {/* 4. Reports */}
      {menuItem(
        "reports",
        "/app/reports",
        t("reports"),
        <AssessmentIcon sx={{ color: "warning.main" }} />,
        isReportsSection
      )}
    </List>
  );
}

export default MainMenuItems;
