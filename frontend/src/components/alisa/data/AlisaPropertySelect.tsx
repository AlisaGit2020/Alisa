import axios from "axios";
import React, { useState } from "react";
import DataService from "@alisa-lib/data-service.ts";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity.ts";
import { propertyContext } from "@alisa-lib/alisa-contexts.ts";
import { TFunction } from "i18next";
import AlisaSelectVariant from "../form/AlisaSelectVariant.tsx";
import { AlisaSelectVariantType } from "@alisa-lib/types.ts";

interface AlisaPropertySelectProps {
  onSelectProperty: (propertyId: number) => void;
  selectedPropertyId?: number;
  t: TFunction;
  variant: AlisaSelectVariantType;
  direction?: "row" | "column";
  showEmptyValue?: boolean;
  size?: "small" | "medium";
}

function AlisaPropertySelect(props: AlisaPropertySelectProps) {
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
    return <div>Loading...</div>;
  }

  return (
    <AlisaSelectVariant
      variant={props.variant ? props.variant : "select"}
      direction={props.direction ? props.direction : "column"}
      label={props.t ? props.t("property") : "Property"}
      value={props.selectedPropertyId as number}
      onChange={props.onSelectProperty}
      items={properties}
      showEmptyValue={Boolean(props.showEmptyValue)}
      size={props.size}
      t={props.t}
    ></AlisaSelectVariant>
  );
}

export default AlisaPropertySelect;
