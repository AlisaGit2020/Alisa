import AssetSelectField, { AssetSelectFieldItem } from "./AssetSelectField.tsx";
import AssetRadioGroup from "./AssetRadioGroup.tsx";
import AssetButtonGroup from "./AssetButtonGroup.tsx";
import AssetSplitButton from "./AssetSplitButton.tsx";
import { AssetSelectVariantType } from "@asset-lib/types.ts";
import { DATA_NOT_SELECTED_ID } from "@asset-lib/constants.ts";
import { TFunction } from "i18next";

function AssetSelectVariant(props: {
  label?: string;
  value: number;
  items: AssetSelectFieldItem[];
  variant: AssetSelectVariantType;
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
        <AssetSelectField
          label={props.label as string}
          value={props.value}
          onChange={(e) => props.onChange(Number(e.target.value))}
          items={props.items}
          size={props.size}
        ></AssetSelectField>
      );
    }

    if (props.variant === "radio") {
      const itemsWithName = props.items.map((item) => ({
        id: item.id,
        name: item.name || "",
      }));
      return (
        <AssetRadioGroup
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
        <AssetButtonGroup
          label={props.label}
          value={props.value}
          items={itemsWithName}
          onChange={props.onChange}
          direction={props.direction}
        ></AssetButtonGroup>
      );
    }

    if (props.variant === "split-button") {
      return (
        <AssetSplitButton
          label={props.label}
          value={props.value}
          items={props.items}
          onChange={props.onChange}
          direction={props.direction}
        ></AssetSplitButton>
      );
    }
  }
}

export default AssetSelectVariant;
