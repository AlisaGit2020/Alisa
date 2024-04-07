import { IconButton, Tooltip } from "@mui/material";
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
      <IconButton onClick={props.onClick}>
        <AlisaAddIcon></AlisaAddIcon>
      </IconButton>
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
