import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TFunction } from "i18next";
import AssetSelectVariant from "../form/AssetSelectVariant.tsx";
import { TransactionTypeName, transactionTypeNames } from "@asset-types";
import { AssetSelectFieldItem } from "../form/AssetSelectField.tsx";
import { AssetSelectVariantType } from "@asset-lib/types.ts";

interface AssetTransactionTypeSelectProps {
  onSelect: (propertyId: number) => void;
  selectedValue: number;
  t: TFunction;
  variant: AssetSelectVariantType;
  direction?: "row" | "column";
  showLabel?: boolean;
  visible?: boolean;
  showEmptyValue?: boolean;
  excludeTypes?: number[];
}

function AssetTransactionTypeSelect(props: AssetTransactionTypeSelectProps) {
  const { t } = props;
  const { i18n } = useTranslation();
  const showLabel = props.showLabel ? props.showLabel : false;
  const visible = props.visible !== undefined ? props.visible : true;

  // Use useMemo to recompute when language or excludeTypes changes
  // i18n.language is needed because t function reference doesn't change on language switch
  const transactionTypes = useMemo(() => {
    const data: AssetSelectFieldItem[] = [];
    transactionTypeNames.forEach((value: TransactionTypeName, key: number) => {
      // Skip excluded types
      if (props.excludeTypes?.includes(key)) {
        return;
      }
      data.push({ id: key, name: t(value) });
    });
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, props.excludeTypes, i18n.language]);

  if (!visible) {
    return null;
  }

  return (
    <AssetSelectVariant
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
    ></AssetSelectVariant>
  );
}

export default AssetTransactionTypeSelect;
