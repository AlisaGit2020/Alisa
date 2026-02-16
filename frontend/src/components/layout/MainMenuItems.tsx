import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WorkIcon from "@mui/icons-material/Work";
import AssessmentIcon from "@mui/icons-material/Assessment";

interface MainMenuItemsProps {
  open: boolean;
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
    if (!open) {
      // Collapsed: Show icon centered with small text below
      return (
        <ListItemButton
          key={id}
          component="a"
          href={href}
          selected={selected}
          sx={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 1.5,
            px: 0.5,
            minHeight: 64,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: "auto",
              justifyContent: "center",
            }}
          >
            {icon}
          </ListItemIcon>
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              fontSize: "0.65rem",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>
        </ListItemButton>
      );
    }

    // Expanded: Normal horizontal layout
    return (
      <ListItemButton
        key={id}
        component="a"
        href={href}
        selected={selected}
        sx={{ pl: 2 }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    );
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
