import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface AlisaDataTableActionButtonsProps {
  id: number;
  onEdit?: (id: number) => void;
  onDelete: (id: number) => void;
}
function AlisaDataTableActionButtons(props: AlisaDataTableActionButtonsProps) {
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
          <EditIcon></EditIcon>
        </IconButton>
      )}
      <IconButton onClick={() => props.onDelete(props.id)}>
        <DeleteIcon></DeleteIcon>
      </IconButton>
    </>
  );
}

export default AlisaDataTableActionButtons;
