import axios from "axios";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DataService from "@asset-lib/data-service.ts";
import { Property } from "@asset-types";
import { propertyContext } from "@asset-lib/asset-contexts.ts";
import { TFunction } from "i18next";
import AssetSelectVariant from "../form/AssetSelectVariant.tsx";
import { AssetSelectVariantType } from "@asset-lib/types.ts";

interface AssetPropertySelectProps {
  onSelectProperty: (propertyId: number) => void;
  selectedPropertyId?: number;
  t: TFunction;
  variant: AssetSelectVariantType;
  direction?: "row" | "column";
  showEmptyValue?: boolean;
  size?: "small" | "medium";
}

function AssetPropertySelect(props: AssetPropertySelectProps) {
  const { t: tCommon } = useTranslation("common");
  const [properties, setProperties] = useState<Property[]>([]);
  const [ready, setReady] = useState<boolean>(false);

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      /* empty */
    }
  };

  React.useEffect(() => {
    const dataService = new DataService<Property>({
      context: propertyContext,
      fetchOptions: {
        select: ["id", "name"],
        order: { name: "ASC" },
      },
    });
    const fetchData = async () => {
      let fetchedProperties: Property[] = [];
      try {
        fetchedProperties = await dataService.search();

        if ((!props.selectedPropertyId || props.selectedPropertyId === 0) && fetchedProperties.length > 0) {
          props.onSelectProperty(fetchedProperties[0].id);
        }
      } catch (error) {
        handleApiError(error);
      }
      setReady(true);
      return fetchedProperties;
    };

    fetchData().then(setProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return <div>{tCommon("loading")}</div>;
  }

  return (
    <AssetSelectVariant
      variant={props.variant ? props.variant : "select"}
      direction={props.direction ? props.direction : "column"}
      label={props.t ? props.t("property") : "Property"}
      value={props.selectedPropertyId as number}
      onChange={props.onSelectProperty}
      items={properties}
      showEmptyValue={Boolean(props.showEmptyValue)}
      size={props.size}
      t={props.t}
    ></AssetSelectVariant>
  );
}

export default AssetPropertySelect;
