import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Paper,
} from "@mui/material";

import { TFunction } from "i18next";
import { TransactionType } from "@alisa-backend/common/types.ts";
import {
  AlisaDepositIcon,
  AlisaExpenseIcon,
  AlisaImportIcon,
  AlisaIncomeIcon,
  AlisaWithdrawIcon,
} from "../../alisa/AlisaIcons.tsx";

function TransactionAddMenu(props: {
  t: TFunction;
  onClose: () => void;
  onAddTransaction: (type: TransactionType) => void;
  onImport: () => void;
  anchorEl: null | HTMLElement;
}) {
  return (
    <Paper sx={{ width: 320, minWidth: 220, maxWidth: "100%" }}>
      <Menu
        anchorEl={props.anchorEl}
        open={Boolean(props.anchorEl)}
        onClose={props.onClose}
      >
        <MenuList>
          <MenuItem>
            <ListItemText>{props.t("add")}</ListItemText>
          </MenuItem>
          <Divider></Divider>
          <MenuItem
            onClick={() => props.onAddTransaction(TransactionType.EXPENSE)}
          >
            <ListItemIcon>
              <AlisaExpenseIcon size="small" />
            </ListItemIcon>
            <ListItemText>{props.t("expense")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => props.onAddTransaction(TransactionType.INCOME)}
          >
            <ListItemIcon>
              <AlisaIncomeIcon size={"small"} />
            </ListItemIcon>
            <ListItemText>{props.t("income")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => props.onAddTransaction(TransactionType.DEPOSIT)}
          >
            <ListItemIcon>
              <AlisaDepositIcon size={"small"} />
            </ListItemIcon>
            <ListItemText>{props.t("deposit")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => props.onAddTransaction(TransactionType.WITHDRAW)}
          >
            <ListItemIcon>
              <AlisaWithdrawIcon size={"small"} />
            </ListItemIcon>
            <ListItemText>{props.t("withdraw")}</ListItemText>
          </MenuItem>
          <MenuItem onClick={props.onImport}>
            <ListItemIcon>
              <AlisaImportIcon size={"small"} />
            </ListItemIcon>
            <ListItemText>{props.t("import")}</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Paper>
  );
}

export default TransactionAddMenu;
