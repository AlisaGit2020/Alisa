import React, { useState } from "react";

import { TFunction } from "i18next";
import AssetSelectVariant from "../form/AssetSelectVariant.tsx";
import { TransactionStatusName, transactionStatusNames } from "@asset-types";
import { AssetSelectFieldItem } from "../form/AssetSelectField.tsx";
import { AssetSelectVariantType } from "@asset-lib/types.ts";

interface AssetTransactionStatusSelectProps {
  onSelect: (statusId: number) => void;
  selectedValue?: number;
  t: TFunction;
  variant?: AssetSelectVariantType;
  direction?: "row" | "column";
  showLabel?: boolean;
  showEmptyValue?: boolean;
}

function AssetTransactionStatusSelect(
  props: AssetTransactionStatusSelectProps,
) {
  const { t } = props;
  const [items, setItems] = useState<AssetSelectFieldItem[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const showLabel = props.showLabel ? props.showLabel : false;

  React.useEffect(() => {
    const fetchData = async () => {
      const data: AssetSelectFieldItem[] = [];
      transactionStatusNames.forEach(
        (value: TransactionStatusName, key: number) => {
          data.push({ id: key, name: t(value) });
        },
      );
      setReady(true);
      return data;
    };

    fetchData().then(setItems);
  }, [t]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <AssetSelectVariant
      variant={props.variant ? props.variant : "select"}
      direction={props.direction ? props.direction : "column"}
      label={
        showLabel
          ? props.t
            ? props.t("transactionStatus")
            : "TransactionStatus"
          : ""
      }
      value={props.selectedValue as number}
      onChange={props.onSelect}
      items={items}
      showEmptyValue={Boolean(props.showEmptyValue)}
      t={props.t}
    ></AssetSelectVariant>
  );
}

export default AssetTransactionStatusSelect;
