import { Chip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import CheckIcon from "@mui/icons-material/Check";
import { useEffect, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../transaction/TransactionLeftMenuItems";
import DataService from "@alisa-lib/data-service";
import { Property } from "@alisa-types";
import { propertyContext } from "@alisa-lib/alisa-contexts";

function PropertyBadge() {
  const { t } = useTranslation("dashboard");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<number>(getTransactionPropertyId());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const dataService = new DataService<Property>({
          context: propertyContext,
          fetchOptions: {
            select: ["id", "name"],
            order: { name: "ASC" },
          },
        });
        const result = await dataService.search();
        setProperties(result);
      } catch {
        setProperties([]);
      }
    };

    fetchProperties();
  }, []);

  // Listen for property changes
  useEffect(() => {
    const handlePropertyChange = (event: CustomEvent<{ propertyId: number }>) => {
      setPropertyId(event.detail.propertyId);
    };

    window.addEventListener(
      TRANSACTION_PROPERTY_CHANGE_EVENT,
      handlePropertyChange as unknown as globalThis.EventListener
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChange as unknown as globalThis.EventListener
      );
    };
  }, []);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectProperty = (id: number) => {
    setPropertyId(id);
    setTransactionPropertyId(id);
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId: id },
      })
    );
    handleClose();
  };

  const getPropertyName = () => {
    if (propertyId === 0) {
      return t("allProperties");
    }
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || t("allProperties");
  };

  return (
    <>
      <Chip
        icon={<HomeWorkIcon />}
        label={getPropertyName()}
        variant="outlined"
        onClick={handleClick}
        sx={{
          color: "inherit",
          borderColor: "rgba(255, 255, 255, 0.5)",
          cursor: "pointer",
          fontSize: "0.95rem",
          padding: "4px 8px",
          height: "auto",
          "& .MuiChip-label": {
            padding: "4px 8px",
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
          "& .MuiChip-icon": {
            color: "inherit",
            fontSize: "1.2rem",
          },
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem
          onClick={() => handleSelectProperty(0)}
          selected={propertyId === 0}
        >
          <ListItemIcon>
            {propertyId === 0 && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{t("allProperties")}</ListItemText>
        </MenuItem>
        {properties.map((property) => (
          <MenuItem
            key={property.id}
            onClick={() => handleSelectProperty(property.id)}
            selected={propertyId === property.id}
          >
            <ListItemIcon>
              {propertyId === property.id && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{property.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default PropertyBadge;
