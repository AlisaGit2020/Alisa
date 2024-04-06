import React, { useState } from "react";

import { TFunction } from "i18next";
import AlisaSelectVariant from "../form/AlisaSelectVariant.tsx";
import {
  TransactionTypeName,
  transactionTypeNames,
} from "@alisa-backend/common/types.ts";
import { AlisaSelectFieldItem } from "../form/AlisaSelectField.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";

interface AlisaTransactionTypeSelectProps {
  onSelectTransactionType: (propertyId: number) => void;
  defaultTransactionTypeId?: number;
  t: TFunction;
  variant?: AlisaSelectVariantType;
  direction?: "row" | "column";
}

function AlisaTransactionTypeSelect(props: AlisaTransactionTypeSelectProps) {
  const [transactionTypes, setTransactionTypes] = useState<
    AlisaSelectFieldItem[]
  >([]);
  const [ready, setReady] = useState<boolean>(false);

  React.useEffect(() => {
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

  return (
    <AlisaSelectVariant
      variant={props.variant ? props.variant : "select"}
      direction={props.direction ? props.direction : "column"}
      label={props.t ? props.t("transactionType") : "TransactionType"}
      value={props.defaultTransactionTypeId as number}
      onChange={props.onSelectTransactionType}
      items={transactionTypes}
    ></AlisaSelectVariant>
  );
}

export default AlisaTransactionTypeSelect;
