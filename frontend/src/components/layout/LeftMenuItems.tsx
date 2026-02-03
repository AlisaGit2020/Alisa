import List from "@mui/material/List";
import { accountingContext } from "@alisa-lib/alisa-contexts";
import AccountingLeftMenuItems from "../accounting/AccountingLeftMenuItems.tsx";

interface LeftMenuItemsProps {
  open: boolean;
}

function LeftMenuItems({ open }: LeftMenuItemsProps) {
  const currentPath = window.location.pathname;

  const getItems = () => {
    if (currentPath.startsWith(accountingContext.routePath)) {
      return <AccountingLeftMenuItems open={open} />;
    }
  };
  return <List component="nav">{getItems()}</List>;
}

export default LeftMenuItems;
