import AlisaSelectField, { AlisaSelectFieldItem } from "./AlisaSelectField.tsx";
import AlisaRadioGroup from "./AlisaRadioGroup.tsx";
import AlisaButtonGroup from "./AlisaButtonGroup.tsx";
import AlisaSplitButton from "./AlisaSplitButton.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";

function AlisaSelectVariant(props: {
  label?: string;
  value: number;
  items: AlisaSelectFieldItem[];
  variant: AlisaSelectVariantType;
  onChange: (value: number) => void;
  direction?: "row" | "column";
}) {
  if (props.items.length > 0) {
    if (props.variant === "select") {
      return (
        <AlisaSelectField
          label={props.label as string}
          value={props.value}
          onChange={(e) => props.onChange(Number(e.target.value))}
          items={props.items}
        ></AlisaSelectField>
      );
    }

    if (props.variant === "radio") {
      return (
        <AlisaRadioGroup
          label={props.label}
          value={props.value}
          items={props.items}
          onChange={props.onChange}
          direction={props.direction}
        />
      );
    }

    if (props.variant === "button") {
      return (
        <AlisaButtonGroup
          label={props.label}
          value={props.value}
          items={props.items}
          onChange={props.onChange}
          direction={props.direction}
        ></AlisaButtonGroup>
      );
    }

    if (props.variant === "split-button") {
      return (
        <AlisaSplitButton
          label={props.label}
          value={props.value}
          items={props.items}
          onChange={props.onChange}
          direction={props.direction}
        ></AlisaSplitButton>
      );
    }
  }
}

export default AlisaSelectVariant;
