import axios from "axios";
import React, { useState } from "react";
import DataService from "@alisa-lib/data-service.ts";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity.ts";
import { propertyContext } from "@alisa-lib/alisa-contexts.ts";
import { Button, ButtonGroup } from "@mui/material";

import AlisaSelectField from "../form/AlisaSelectField.tsx";
import { TFunction } from "i18next";
import AlisaRadioGroup from "../form/AlisaRadioGroup.tsx";

interface AlisaPropertySelectProps {
  onSelectProperty: (propertyId: number) => void;
  defaultPropertyId?: number;
  t?: TFunction;
  variant?: "select" | "radio" | "button";
  direction?: "row" | "column";
}

function AlisaPropertySelect(props: AlisaPropertySelectProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const dataService = new DataService<Property>({
    context: propertyContext,
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        return await dataService.search();
      } catch (error) {
        handleApiError(error);
      }

      return properties;
    };

    fetchData().then(setProperties);
  }, []);

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      /* empty */
    }
  };

  const isSelected = (propertyId: number) => {
    return props.defaultPropertyId === propertyId;
  };

  if (properties.length > 0) {
    if (props.variant === "select") {
      return (
        <AlisaSelectField
          label={props.t ? props.t("property") : "Property"}
          value={props.defaultPropertyId as number}
          onChange={(e) => props.onSelectProperty(Number(e.target.value))}
          items={properties}
        ></AlisaSelectField>
      );
    }

    if (props.variant === "radio") {
      return (
        <AlisaRadioGroup
          label={props.t ? props.t("property") : "Property"}
          value={props.defaultPropertyId as number}
          items={properties}
          onChange={props.onSelectProperty}
          direction={props.direction}
        />
      );
    }

    if (props.variant === "button") {
      const buttons = properties.map((property) => (
        <Button
          key={property.id}
          onClick={() => props.onSelectProperty(property.id)}
          variant={isSelected(property.id) ? "contained" : "outlined"}
        >
          {property.name}
        </Button>
      ));
      return (
        <ButtonGroup
          orientation={props.direction === "row" ? "horizontal" : "vertical"}
          aria-label="Property Select Buttons"
          variant="text"
        >
          {buttons}
        </ButtonGroup>
      );
    }
  }
}

export default AlisaPropertySelect;
