import List from "@mui/material/List";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import TransactionLeftMenuItems from "../transaction/TransactionLeftMenuItems.tsx";

function LeftMenuItems() {
  const currentPath = window.location.pathname;

  const getItems = () => {
    if (currentPath.includes(transactionContext.routePath)) {
      return <TransactionLeftMenuItems></TransactionLeftMenuItems>;
    }
  };
  return <List component="nav">{getItems()}</List>;
}

export default LeftMenuItems;
