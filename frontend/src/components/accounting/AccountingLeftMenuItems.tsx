import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import DoneIcon from "@mui/icons-material/Done";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import Divider from "@mui/material/Divider";

import { WithTranslation, withTranslation } from "react-i18next";
import {
  transactionContext,
  expenseContext,
  incomeContext,
} from "@alisa-lib/alisa-contexts";

interface AccountingLeftMenuItemsProps extends WithTranslation {
  open: boolean;
}

function AccountingLeftMenuItems({ t }: AccountingLeftMenuItemsProps) {
  const currentPath = window.location.pathname;

  return (
    <>
      <ListItemButton
        component="a"
        href={transactionContext.routePath}
        selected={currentPath === transactionContext.routePath}
      >
        <ListItemIcon>
          <DoneIcon />
        </ListItemIcon>
        <ListItemText primary={t("accepted")} />
      </ListItemButton>

      <ListItemButton
        component="a"
        href={`${transactionContext.routePath}/pending`}
        selected={currentPath === `${transactionContext.routePath}/pending`}
      >
        <ListItemIcon>
          <HourglassTopIcon />
        </ListItemIcon>
        <ListItemText primary={t("pending")} />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <ListItemButton
        component="a"
        href={expenseContext.routePath}
        selected={currentPath === expenseContext.routePath}
      >
        <ListItemIcon>
          <ReceiptIcon />
        </ListItemIcon>
        <ListItemText primary={t("expenses")} />
      </ListItemButton>

      <ListItemButton
        component="a"
        href={incomeContext.routePath}
        selected={currentPath === incomeContext.routePath}
      >
        <ListItemIcon>
          <PaymentsIcon />
        </ListItemIcon>
        <ListItemText primary={t("incomes")} />
      </ListItemButton>
    </>
  );
}

export default withTranslation("accounting")(AccountingLeftMenuItems);
