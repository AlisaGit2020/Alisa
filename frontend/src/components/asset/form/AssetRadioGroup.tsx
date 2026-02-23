import { Box, FormControlLabel, Radio, RadioGroup } from "@mui/material";

export type AssetRadioGroupItem = {
  id: number;
  name: string;
};
function AssetRadioGroup(props: {
  label?: string;
  value: number;
  items: AssetRadioGroupItem[];
  onChange: (value: number) => void;
  direction?: "row" | "column";
}) {
  console.log(props.value);
  return (
    <RadioGroup
      aria-labelledby="demo-radio-buttons-group-label"
      defaultValue={props.value.toString()}
      name="radio-group"
      aria-label={props.label}
      sx={{
        flexDirection: props.direction,
        border: 1,
        borderRadius: 1,
        borderColor: "divider",
        padding: 1,
        position: "relative",
      }}
    >
      {props.label && (
        <Box
          sx={{
            fontSize: "0.8rem",
            letterSpacing: "0.00938em",
            color: "text.secondary",
            marginBottom: 1,
            position: "absolute",
            //Override the border with own background color
            backgroundColor: "background.paper",
            display: "block",
            top: -11,
            zIndex: 1,
          }}
        >
          {props.label}
        </Box>
      )}
      {props.items.map((item) => (
        <FormControlLabel
          key={item.id}
          value={item.id.toString()}
          control={<Radio />}
          label={item.name}
          onClick={() => props.onChange(item.id)}
          sx={{ marginRight: props.direction === "row" ? 3 : 0 }}
        ></FormControlLabel>
      ))}
    </RadioGroup>
  );
}

export default AssetRadioGroup;
