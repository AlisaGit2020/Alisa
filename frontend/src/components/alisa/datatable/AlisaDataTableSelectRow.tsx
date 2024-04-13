import { Checkbox, Tooltip } from "@mui/material";
import { TFunction } from "i18next";

interface AlisaDataTableSelectRowHeaderProps {
  t: TFunction;
  onSelectAll: () => void;
  checked: boolean;
  visible?: boolean;
}
export function AlisaDataTableSelectHeaderRow(
  props: AlisaDataTableSelectRowHeaderProps,
) {
  const visible = props.visible === undefined ? true : props.visible;
  if (!visible) {
    return;
  }
  return (
    <Tooltip title={props.t("selectAll")}>
      <Checkbox checked={props.checked} onChange={props.onSelectAll}></Checkbox>
    </Tooltip>
  );
}

interface AlisaDataTableSelectRowProps {
  id: number;
  onSelect: (id: number) => void;
  selectedIds: number[];
}
function AlisaDataTableSelectRow(props: AlisaDataTableSelectRowProps) {
  return (
    <>
      {props.onSelect && (
        <Checkbox
          checked={props.selectedIds.includes(props.id)}
          onChange={() => {
            if (props.onSelect) {
              props.onSelect(props.id as number);
            }
          }}
        ></Checkbox>
      )}
    </>
  );
}

export default AlisaDataTableSelectRow;
