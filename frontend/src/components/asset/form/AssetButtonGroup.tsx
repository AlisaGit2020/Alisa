import { Button, ButtonGroup } from "@mui/material";

export type AssetButtonGroupItem = {
  id: number;
  name: string;
};
function AssetButtonGroup(props: {
  label?: string;
  value: number;
  items: AssetButtonGroupItem[];
  onChange: (value: number) => void;
  direction?: "row" | "column";
}) {
  const isSelected = (propertyId: number) => {
    return props.value === propertyId;
  };
  const buttons = props.items.map((item) => (
    <Button
      key={item.id}
      onClick={() => props.onChange(item.id)}
      variant={isSelected(item.id) ? "contained" : "outlined"}
    >
      {item.name}
    </Button>
  ));
  return (
    <ButtonGroup
      orientation={props.direction === "row" ? "horizontal" : "vertical"}
      aria-label="Property Select Buttons"
      variant="text"
    >
      {buttons}
    </ButtonGroup>
  );
}

export default AssetButtonGroup;
