import axios from "axios";
import React, { useState } from "react";
import DataService from "@alisa-lib/data-service";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity.ts";
import { propertyContext } from "@alisa-lib/alisa-contexts.ts";
import { Avatar, Box, Paper, Stack } from "@mui/material";

interface AlisaPropertySelectProps {
  onSelectProperty: (propertyId: number) => void;
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

  if (properties.length > 0) {
    return (
      <Stack direction={"row"} spacing={2}>
        {properties.map((property) => (
          <Paper
            sx={{ padding: 2, cursor: "pointer" }}
            onClick={() => props.onSelectProperty(property.id)}
            key={property.id}
          >
            <Stack direction={"row"} spacing={2}>
              <Avatar src={`/assets/properties/${property.name}.jpg`}></Avatar>
              <Box>{property.name}</Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }
}

export default AlisaPropertySelect;
