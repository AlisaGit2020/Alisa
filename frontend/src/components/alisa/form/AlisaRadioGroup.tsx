import { Box, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { grey } from "@mui/material/colors";

export type AlisaRadioGroupItem = {
  id: number;
  name: string;
};
function AlisaRadioGroup(props: {
  label?: string;
  value: number;
  items: AlisaRadioGroupItem[];
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
        borderColor: grey["A400"],
        padding: 1,
        position: "relative",
      }}
    >
      {props.label && (
        <Box
          sx={{
            fontSize: "0.8rem",
            letterSpacing: "0.00938em",
            color: grey["600"],
            marginBottom: 1,
            position: "absolute",
            //Override the border with own background color
            backgroundColor: "white",
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

export default AlisaRadioGroup;
