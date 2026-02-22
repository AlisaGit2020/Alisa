import AlisaSelectField, { AlisaSelectFieldItem } from "./AlisaSelectField.tsx";
import AlisaRadioGroup from "./AlisaRadioGroup.tsx";
import AlisaButtonGroup from "./AlisaButtonGroup.tsx";
import AlisaSplitButton from "./AlisaSplitButton.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";
import { DATA_NOT_SELECTED_ID } from "@alisa-lib/constants.ts";
import { TFunction } from "i18next";

function AlisaSelectVariant(props: {
  label?: string;
  value: number;
  items: AlisaSelectFieldItem[];
  variant: AlisaSelectVariantType;
  onChange: (value: number) => void;
  direction?: "row" | "column";
  showEmptyValue: boolean;
  size?: "small" | "medium";
  t: TFunction;
}) {
  const emptyItemIndex = props.items.findIndex(
    (item) => item.id === DATA_NOT_SELECTED_ID,
  );
  if (props.showEmptyValue && emptyItemIndex === -1) {
    props.items.unshift({
      id: DATA_NOT_SELECTED_ID,
      name: props.t("dataNotSelected"),
    });
  }

  if (props.items.length > 0) {
    if (props.variant === "select") {
      return (
        <AlisaSelectField
          label={props.label as string}
          value={props.value}
          onChange={(e) => props.onChange(Number(e.target.value))}
          items={props.items}
          size={props.size}
        ></AlisaSelectField>
      );
    }

    if (props.variant === "radio") {
      const itemsWithName = props.items.map((item) => ({
        id: item.id,
        name: item.name || "",
      }));
      return (
        <AlisaRadioGroup
          label={props.label}
          value={props.value}
          items={itemsWithName}
          onChange={props.onChange}
          direction={props.direction}
        />
      );
    }

    if (props.variant === "button") {
      const itemsWithName = props.items.map((item) => ({
        id: item.id,
        name: item.name || "",
      }));
      return (
        <AlisaButtonGroup
          label={props.label}
          value={props.value}
          items={itemsWithName}
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
