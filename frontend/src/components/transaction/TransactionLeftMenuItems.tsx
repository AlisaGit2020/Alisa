import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import DoneIcon from "@mui/icons-material/Done";

import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";

export const TRANSACTION_PROPERTY_CHANGE_EVENT = "transactionPropertyChange";

interface TransactionsLeftMenuItemsProps extends WithTranslation {
  open: boolean;
}

function TransactionsLeftMenuItems({ t }: TransactionsLeftMenuItemsProps) {
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
    </>
  );
}

export default withTranslation("transaction")(TransactionsLeftMenuItems);
