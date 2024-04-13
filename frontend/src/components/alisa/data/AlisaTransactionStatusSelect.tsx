import React, { useState } from "react";

import { TFunction } from "i18next";
import AlisaSelectVariant from "../form/AlisaSelectVariant.tsx";
import {
  TransactionStatusName,
  transactionStatusNames,
} from "@alisa-backend/common/types.ts";
import { AlisaSelectFieldItem } from "../form/AlisaSelectField.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";

interface AlisaTransactionStatusSelectProps {
  onSelect: (statusId: number) => void;
  selectedValue?: number;
  t: TFunction;
  variant?: AlisaSelectVariantType;
  direction?: "row" | "column";
  showLabel?: boolean;
  showEmptyValue?: boolean;
}

function AlisaTransactionStatusSelect(
  props: AlisaTransactionStatusSelectProps,
) {
  const [items, setItems] = useState<AlisaSelectFieldItem[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const showLabel = props.showLabel ? props.showLabel : false;

  React.useEffect(() => {
    const fetchData = async () => {
      const data: AlisaSelectFieldItem[] = [];
      transactionStatusNames.forEach(
        (value: TransactionStatusName, key: number) => {
          data.push({ id: key, name: props.t(value) });
        },
      );
      setReady(true);
      return data;
    };

    fetchData().then(setItems);
  }, [ready]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <AlisaSelectVariant
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
    ></AlisaSelectVariant>
  );
}

export default AlisaTransactionStatusSelect;
