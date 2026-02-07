import React, { useState } from "react";

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
}

function AlisaTransactionTypeSelect(props: AlisaTransactionTypeSelectProps) {
  const [transactionTypes, setTransactionTypes] = useState<
    AlisaSelectFieldItem[]
  >([]);
  const [ready, setReady] = useState<boolean>(false);
  const showLabel = props.showLabel ? props.showLabel : false;
  const visible = props.visible !== undefined ? props.visible : true;

  React.useEffect(() => {
    if (ready) {
      return;
    }
    const fetchData = async () => {
      //Loop through the transactionTypeNames array and create a new array of AlisaSelectFieldItem objects
      const data: AlisaSelectFieldItem[] = [];
      transactionTypeNames.forEach(
        (value: TransactionTypeName, key: number) => {
          data.push({ id: key, name: props.t(value) });
        },
      );

      setReady(true);
      return data;
    };

    fetchData().then(setTransactionTypes);
  }, []);

  if (!ready) {
    return <div>Loading...</div>;
  }

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
