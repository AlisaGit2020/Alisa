import { Fab, IconButton, Tooltip } from "@mui/material";
import { TFunction } from "i18next";
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
  onDelete: (id: number) => void;
  visible?: boolean;
}
function AlisaDataTableActionButtons(props: AlisaDataTableActionButtonsProps) {
  const visible = props.visible === undefined ? true : props.visible;
  if (!visible) {
    return null;
  }
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
      <IconButton onClick={() => props.onDelete(props.id)}>
        <AlisaDeleteIcon></AlisaDeleteIcon>
      </IconButton>
    </>
  );
}

export default AlisaDataTableActionButtons;
