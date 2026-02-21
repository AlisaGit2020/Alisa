import { Fab, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TFunction } from "i18next";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import React from "react";
import {
  AlisaAddIcon,
  AlisaDeleteIcon,
  AlisaEditIcon,
} from "../AlisaIcons.tsx";

interface AlisaDataTableAddButtonProps {
  onClick: () => void;
  visible?: boolean;
  t: TFunction;
}

export function AlisaDataTableAddButton(props: AlisaDataTableAddButtonProps) {
  const visible = props.visible === undefined ? true : props.visible;
  if (!visible) {
    return null;
  }
  return (
    <Tooltip title={props.t("add")}>
      <Fab
        color="primary"
        size="small"
        onClick={props.onClick}
        sx={{
          boxShadow: 2,
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: 4,
          },
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        <AlisaAddIcon />
      </Fab>
    </Tooltip>
  );
}

interface AlisaDataTableActionButtonsProps {
  id: number;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  visible?: boolean;
  t: TFunction;
}
function AlisaDataTableActionButtons(props: AlisaDataTableActionButtonsProps) {
  const visible = props.visible === undefined ? true : props.visible;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    props.onEdit?.(props.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    props.onDelete?.(props.id);
  };

  if (!visible) {
    return null;
  }

  // Mobile view: show menu with actions
  if (isMobile) {
    return (
      <>
        <IconButton
          aria-label="actions"
          aria-controls={menuOpen ? "action-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          onClick={handleMenuOpen}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="action-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {props.onEdit && (
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <AlisaEditIcon size="small" />
              </ListItemIcon>
              <ListItemText>{props.t("edit")}</ListItemText>
            </MenuItem>
          )}
          {props.onDelete && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <AlisaDeleteIcon size="small" />
              </ListItemIcon>
              <ListItemText>{props.t("delete")}</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </>
    );
  }

  // Desktop view: show individual action buttons
  return (
    <>
      {props.onEdit && (
        <IconButton
          onClick={() => {
            if (props.onEdit) {
              props.onEdit(props.id);
            }
          }}
        >
          <AlisaEditIcon></AlisaEditIcon>
        </IconButton>
      )}
      {props.onDelete && (
        <IconButton onClick={() => props.onDelete?.(props.id)}>
          <AlisaDeleteIcon></AlisaDeleteIcon>
        </IconButton>
      )}
    </>
  );
}

export default AlisaDataTableActionButtons;
