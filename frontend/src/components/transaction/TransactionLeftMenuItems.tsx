import { Box, Divider, Popover } from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import DoneIcon from "@mui/icons-material/Done";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import AlisaPropertySelect from "../alisa/data/AlisaPropertySelect";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import React, { useState } from "react";

export const TRANSACTION_PROPERTY_CHANGE_EVENT = "transactionPropertyChange";

interface TransactionsLeftMenuItemsProps extends WithTranslation {
  open: boolean;
}

function TransactionsLeftMenuItems({ t, open }: TransactionsLeftMenuItemsProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(
    getTransactionPropertyId()
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSelectProperty = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    setTransactionPropertyId(propertyId);
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId },
      })
    );
    setAnchorEl(null);
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {open ? (
        <Box sx={{ px: 2, py: 1, width: 208, "& .MuiTextField-root": { width: "100%" } }}>
          <AlisaPropertySelect
            variant="select"
            t={t}
            direction="column"
            onSelectProperty={handleSelectProperty}
            selectedPropertyId={selectedPropertyId}
            size="small"
          />
        </Box>
      ) : (
        <>
          <ListItemButton onClick={handleOpenPopover}>
            <ListItemIcon>
              <HomeWorkIcon />
            </ListItemIcon>
          </ListItemButton>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <Box sx={{ p: 2, width: 200 }}>
              <AlisaPropertySelect
                variant="select"
                t={t}
                direction="column"
                onSelectProperty={handleSelectProperty}
                selectedPropertyId={selectedPropertyId}
                size="small"
              />
            </Box>
          </Popover>
        </>
      )}

      <Divider sx={{ my: 1 }} />

      <ListItemButton component="a" href={transactionContext.routePath}>
        <ListItemIcon>
          <DoneIcon />
        </ListItemIcon>
        <ListItemText primary={t("accepted")} />
      </ListItemButton>

      <ListItemButton
        component="a"
        href={`${transactionContext.routePath}/pending`}
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
