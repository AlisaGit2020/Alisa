import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalculateIcon from "@mui/icons-material/Calculate";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  propertyContext,
  accountingContext,
  transactionContext,
  expenseContext,
  incomeContext,
  taxContext,
  reportContext,
} from "@alisa-lib/alisa-contexts";
import AssessmentIcon from "@mui/icons-material/Assessment";

interface MainMenuItemsProps {
  open: boolean;
  isMobile?: boolean;
}

function MainMenuItems({ open, isMobile = false }: MainMenuItemsProps) {
  const { t } = useTranslation("menu");
  const { t: tAccounting } = useTranslation("accounting");
  const currentPath = window.location.pathname;

  const isAccountingRoute = currentPath.startsWith(accountingContext.routePath);
  const [accountingOpen, setAccountingOpen] = useState(isAccountingRoute);

  // Initialize accounting menu state based on current route
  const [accountingInitialized, setAccountingInitialized] = useState(false);

  React.useLayoutEffect(() => {
    if (!accountingInitialized && isAccountingRoute) {
      setAccountingOpen(true);
      setAccountingInitialized(true);
    }
  }, [isAccountingRoute, accountingInitialized]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAccountingOpen(!accountingOpen);
  };

  const menuItem = (
    id: string,
    href: string,
    label: string,
    icon: React.ReactNode,
    selected: boolean,
    indent: number = 0
  ) => {
    const paddingLeft = 2 + indent * 2;
    const button = (
      <ListItemButton
        component="a"
        href={href}
        selected={selected}
        sx={{ pl: paddingLeft }}
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

  const accountingButton = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <ListItemButton
        component="a"
        href={accountingContext.routePath}
        selected={currentPath === accountingContext.routePath}
        sx={{ flexGrow: 1 }}
      >
        <ListItemIcon>
          <AccountBalanceIcon sx={{ color: "primary.main" }} />
        </ListItemIcon>
        <ListItemText primary={t("accounting")} />
      </ListItemButton>
      {open && (
        <IconButton size="small" onClick={handleExpandClick} sx={{ mr: 1 }}>
          {accountingOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      )}
    </Box>
  );

  return (
    <List component="nav">
      {menuItem(
        "dashboard",
        "/app/dashboard",
        t("dashboard"),
        <DashboardIcon sx={{ color: "info.main" }} />,
        currentPath === "/app/dashboard"
      )}
      {menuItem(
        "properties",
        propertyContext.routePath,
        t("properties"),
        <ApartmentIcon sx={{ color: "secondary.main" }} />,
        currentPath.startsWith(propertyContext.routePath)
      )}
      {menuItem(
        "investmentCalculator",
        "/app/investment-calculations",
        t("investmentCalculator"),
        <TrendingUpIcon sx={{ color: "success.main" }} />,
        currentPath.startsWith("/app/investment-calculations")
      )}
      {menuItem(
        "reports",
        reportContext.routePath,
        t("reports"),
        <AssessmentIcon sx={{ color: "primary.main" }} />,
        currentPath.startsWith(reportContext.routePath)
      )}

      {!isMobile && (
        <>
          {open ? (
            accountingButton
          ) : (
            <Tooltip title={t("accounting")} placement="right">
              {accountingButton}
            </Tooltip>
          )}

          <Collapse in={open && accountingOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {menuItem(
                "expenses",
                expenseContext.routePath,
                tAccounting("expenses"),
                <ReceiptIcon sx={{ color: "error.main" }} />,
                currentPath.startsWith(expenseContext.routePath),
                1
              )}
              {menuItem(
                "incomes",
                incomeContext.routePath,
                tAccounting("incomes"),
                <PaymentsIcon sx={{ color: "success.main" }} />,
                currentPath.startsWith(incomeContext.routePath),
                1
              )}
              {menuItem(
                "bank-transactions",
                transactionContext.routePath,
                tAccounting("bankTransactions"),
                <AccountBalanceWalletIcon sx={{ color: "primary.main" }} />,
                currentPath.startsWith(transactionContext.routePath),
                1
              )}
            </List>
          </Collapse>
        </>
      )}

      {menuItem(
        "taxes",
        taxContext.routePath,
        t("taxes"),
        <CalculateIcon sx={{ color: "warning.main" }} />,
        currentPath.startsWith(taxContext.routePath)
      )}
    </List>
  );
}

export default MainMenuItems;
