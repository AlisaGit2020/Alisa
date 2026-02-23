import { Fab, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TFunction } from "i18next";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import React from "react";
import {
  AssetAddIcon,
  AssetDeleteIcon,
  AssetEditIcon,
} from "../AssetIcons.tsx";

interface AssetDataTableAddButtonProps {
  onClick: () => void;
  visible?: boolean;
  t: TFunction;
}

export function AssetDataTableAddButton(props: AssetDataTableAddButtonProps) {
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
        <AssetAddIcon />
      </Fab>
    </Tooltip>
  );
}

interface AssetDataTableActionButtonsProps {
  id: number;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  visible?: boolean;
  t: TFunction;
}
function AssetDataTableActionButtons(props: AssetDataTableActionButtonsProps) {
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
  // Don't render menu button if no actions are available
  if (isMobile) {
    if (!props.onEdit && !props.onDelete) {
      return null;
    }
    const menuId = `action-menu-${props.id}`;
    return (
      <>
        <IconButton
          aria-label="actions"
          aria-controls={menuOpen ? menuId : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          onClick={handleMenuOpen}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id={menuId}
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
                <AssetEditIcon size="small" />
              </ListItemIcon>
              <ListItemText>{props.t("edit")}</ListItemText>
            </MenuItem>
          )}
          {props.onDelete && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <AssetDeleteIcon size="small" />
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
          <AssetEditIcon></AssetEditIcon>
        </IconButton>
      )}
      {props.onDelete && (
        <IconButton onClick={() => props.onDelete?.(props.id)}>
          <AssetDeleteIcon></AssetDeleteIcon>
        </IconButton>
      )}
    </>
  );
}

export default AssetDataTableActionButtons;
