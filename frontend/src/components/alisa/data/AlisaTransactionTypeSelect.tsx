import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TFunction } from "i18next";
import AlisaSelectVariant from "../form/AlisaSelectVariant.tsx";
import { TransactionTypeName, transactionTypeNames } from "@alisa-types";
import { AlisaSelectFieldItem } from "../form/AlisaSelectField.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";

interface AlisaTransactionTypeSelectProps {
  onSelect: (propertyId: number) => void;
  selectedValue: number;
  t: TFunction;
  variant: AlisaSelectVariantType;
  direction?: "row" | "column";
  showLabel?: boolean;
  visible?: boolean;
  showEmptyValue?: boolean;
  excludeTypes?: number[];
}

function AlisaTransactionTypeSelect(props: AlisaTransactionTypeSelectProps) {
  const { t } = props;
  const { i18n } = useTranslation();
  const showLabel = props.showLabel ? props.showLabel : false;
  const visible = props.visible !== undefined ? props.visible : true;

  // Use useMemo to recompute when language or excludeTypes changes
  const transactionTypes = useMemo(() => {
    const data: AlisaSelectFieldItem[] = [];
    transactionTypeNames.forEach((value: TransactionTypeName, key: number) => {
      // Skip excluded types
      if (props.excludeTypes?.includes(key)) {
        return;
      }
      data.push({ id: key, name: t(value) });
    });
    return data;
  }, [t, props.excludeTypes, i18n.language]);

  if (!visible) {
    return null;
  }

  return (
    <AlisaSelectVariant
      variant={props.variant ? props.variant : "select"}
      direction={props.direction ? props.direction : "column"}
      label={
        showLabel
          ? props.t
            ? props.t("transactionType")
            : "TransactionType"
          : ""
      }
      value={props.selectedValue as number}
      onChange={props.onSelect}
      items={transactionTypes}
      showEmptyValue={Boolean(props.showEmptyValue)}
      t={props.t}
    ></AlisaSelectVariant>
  );
}

export default AlisaTransactionTypeSelect;
