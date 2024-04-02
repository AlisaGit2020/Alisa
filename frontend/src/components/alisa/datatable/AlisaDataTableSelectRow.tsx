import { Checkbox, Tooltip } from "@mui/material";
import { TFunction } from "i18next";

interface AlisaDataTableSelectRowProps {
  variant: "th" | "td";
  id?: number;
  t?: TFunction;
  onSelect?: (id: number) => void;
  onHandleSelectAll?: () => void;
  checked?: boolean;
}
function AlisaDataTableSelectRow(props: AlisaDataTableSelectRowProps) {
  if (props.variant === "th" && props.t) {
    return (
      <Tooltip title={props.t("selectAll")}>
        <Checkbox onChange={props.onHandleSelectAll}></Checkbox>
      </Tooltip>
    );
  }
  return (
    <>
      {props.onSelect && (
        <Checkbox
          checked={props.checked}
          onChange={() => {
            alert("onSelect");
          }}
        ></Checkbox>
      )}
    </>
  );
}

export default AlisaDataTableSelectRow;
