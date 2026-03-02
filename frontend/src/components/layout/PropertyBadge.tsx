import {
  Box,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  Avatar,
  Divider,
} from "@mui/material";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import CheckIcon from "@mui/icons-material/Check";
import { useEffect, useState, useRef, useCallback, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../asset";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@asset-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../transaction/TransactionLeftMenuItems";
import DataService from "@asset-lib/data-service";
import { Property, PropertyStatus } from "@asset-types";
import { propertyContext } from "@asset-lib/asset-contexts";
import { getPhotoUrl } from "@asset-lib/functions";

// Event constants for property selection required
export const PROPERTY_SELECTION_REQUIRED_EVENT = "propertySelectionRequired";
export const OPEN_PROPERTY_SELECTOR_EVENT = "openPropertySelector";
export const PROPERTY_LIST_CHANGE_EVENT = "propertyListChange";

// Group properties by status
const groupPropertiesByStatus = (properties: Property[]) => {
  const groups: Record<PropertyStatus, Property[]> = {
    [PropertyStatus.OWN]: [],
    [PropertyStatus.PROSPECT]: [],
    [PropertyStatus.SOLD]: [],
  };

  properties.forEach((property) => {
    if (groups[property.status]) {
      groups[property.status].push(property);
    }
  });

  return groups;
};

// Status display order
const STATUS_ORDER = [PropertyStatus.OWN, PropertyStatus.PROSPECT, PropertyStatus.SOLD];

function PropertyBadge() {
  const { t } = useTranslation("dashboard");
  const { showToast } = useToast();
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

  // Fetch all properties with additional fields for display
  const fetchProperties = useCallback(async () => {
    try {
      const dataService = new DataService<Property>({
        context: propertyContext,
        fetchOptions: {
          select: ["id", "name", "photo", "status"],
          relations: ["address"],
          order: { name: "ASC" },
        },
      });
      const result = await dataService.search();
      setProperties(result);
    } catch {
      setProperties([]);
      showToast({ message: t("common:toast.loadFailed"), severity: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

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

  const getSelectedProperty = () => {
    return properties.find((p) => p.id === propertyId);
  };

  const getPropertyName = () => {
    if (propertyId === 0) {
      return t("allProperties");
    }
    if (isLoading) {
      return "";
    }
    const property = getSelectedProperty();
    return property?.name || t("allProperties");
  };

  const formatAddress = (property: Property) => {
    if (!property.address) return "";
    const parts = [property.address.street, property.address.city].filter(Boolean);
    return parts.join(", ");
  };

  const groupedProperties = groupPropertiesByStatus(properties);
  const selectedProperty = getSelectedProperty();

  return (
    <>
      <Chip
        ref={chipRef}
        data-testid="property-badge"
        avatar={
          <Avatar
            src={getPhotoUrl(selectedProperty?.photo)}
            alt={selectedProperty?.name || t("allProperties")}
            sx={{ width: 24, height: 24 }}
          >
            {!selectedProperty && <HomeWorkIcon sx={{ fontSize: 14 }} />}
          </Avatar>
        }
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
          maxWidth: { xs: 150, sm: 200 },
          "& .MuiChip-label": {
            padding: "4px 8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
          "& .MuiChip-avatar": {
            marginLeft: "4px",
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
        slotProps={{
          paper: {
            sx: {
              maxHeight: { xs: "70vh", sm: 400 },
              minWidth: { xs: 280, sm: 320 },
              maxWidth: { xs: "90vw", sm: 400 },
            },
          },
        }}
      >
        {/* Explanatory header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">
            {t("propertySelector.description")}
          </Typography>
        </Box>

        {/* All Properties option */}
        <MenuItem
          onClick={() => handleSelectProperty(0)}
          selected={propertyId === 0}
          aria-selected={propertyId === 0}
        >
          <ListItemIcon>
            {propertyId === 0 ? <CheckIcon fontSize="small" /> : null}
          </ListItemIcon>
          <ListItemText>{t("allProperties")}</ListItemText>
        </MenuItem>

        <Divider />

        {/* Grouped properties by status */}
        {STATUS_ORDER.map((status) => {
          const statusProperties = groupedProperties[status];
          if (statusProperties.length === 0) return null;

          return [
            <ListSubheader
              key={`header-${status}`}
              sx={{
                backgroundColor: "background.paper",
                lineHeight: "32px",
                fontWeight: 600,
              }}
            >
              {t(`status.${status === PropertyStatus.OWN ? "own" : status === PropertyStatus.PROSPECT ? "prospect" : "sold"}`)}
            </ListSubheader>,
            ...statusProperties.map((property) => (
              <MenuItem
                key={property.id}
                onClick={() => handleSelectProperty(property.id)}
                selected={propertyId === property.id}
                aria-selected={propertyId === property.id}
                sx={{ pl: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  {propertyId === property.id ? (
                    <CheckIcon fontSize="small" data-testid="CheckIcon" />
                  ) : (
                    <Avatar
                      src={getPhotoUrl(property.photo)}
                      alt={property.name}
                      sx={{ width: 28, height: 28 }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={property.name}
                  secondary={formatAddress(property)}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true, variant: "caption" }}
                />
              </MenuItem>
            )),
          ];
        })}
      </Menu>
    </>
  );
}

export default PropertyBadge;
