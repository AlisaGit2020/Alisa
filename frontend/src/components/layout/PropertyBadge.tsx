import { Chip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import CheckIcon from "@mui/icons-material/Check";
import { useEffect, useState, useRef, useCallback, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../transaction/TransactionLeftMenuItems";
import DataService from "@alisa-lib/data-service";
import { Property } from "@alisa-types";
import { propertyContext } from "@alisa-lib/alisa-contexts";

// Event constants for property selection required
export const PROPERTY_SELECTION_REQUIRED_EVENT = "propertySelectionRequired";
export const OPEN_PROPERTY_SELECTOR_EVENT = "openPropertySelector";
export const PROPERTY_LIST_CHANGE_EVENT = "propertyListChange";

function PropertyBadge() {
  const { t } = useTranslation("dashboard");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<number>(getTransactionPropertyId());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl);

  // Handle highlight event - pulse animation when property is required
  const handleHighlight = useCallback(() => {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 2000);
  }, []);

  // Handle open selector event - open the property menu
  const handleOpenSelector = useCallback(() => {
    if (chipRef.current) {
      setAnchorEl(chipRef.current);
    }
  }, []);

  // Listen for property selection required and open selector events
  useEffect(() => {
    window.addEventListener(PROPERTY_SELECTION_REQUIRED_EVENT, handleHighlight);
    window.addEventListener(OPEN_PROPERTY_SELECTOR_EVENT, handleOpenSelector);
    return () => {
      window.removeEventListener(PROPERTY_SELECTION_REQUIRED_EVENT, handleHighlight);
      window.removeEventListener(OPEN_PROPERTY_SELECTOR_EVENT, handleOpenSelector);
    };
  }, [handleHighlight, handleOpenSelector]);

  // Fetch all properties
  const fetchProperties = useCallback(async () => {
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Listen for property list changes
  useEffect(() => {
    const handleListChange = () => {
      fetchProperties();
    };
    window.addEventListener(PROPERTY_LIST_CHANGE_EVENT, handleListChange);
    return () => {
      window.removeEventListener(PROPERTY_LIST_CHANGE_EVENT, handleListChange);
    };
  }, [fetchProperties]);

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
    if (isLoading) {
      return "";
    }
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || t("allProperties");
  };

  return (
    <>
      <Chip
        ref={chipRef}
        data-testid="property-badge"
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
          ...(isHighlighted && {
            animation: "pulse 0.5s ease-in-out 3",
            "@keyframes pulse": {
              "0%, 100%": { boxShadow: "none" },
              "50%": { boxShadow: "0 0 12px 4px rgba(255,193,7,0.8)" },
            },
          }),
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
