import React, { useState, useCallback } from "react";
import {
  PROPERTY_SELECTION_REQUIRED_EVENT,
  OPEN_PROPERTY_SELECTOR_EVENT,
} from "../../components/layout/PropertyBadge";

export function usePropertyRequired(propertyId: number) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const requireProperty = useCallback(
    (event?: React.MouseEvent<HTMLElement>): boolean => {
      if (propertyId > 0) return true;

      // Show popover near the clicked button and highlight PropertyBadge
      if (event?.currentTarget) {
        setAnchorEl(event.currentTarget as HTMLElement);
      }
      setPopoverOpen(true);
      window.dispatchEvent(new CustomEvent(PROPERTY_SELECTION_REQUIRED_EVENT));
      return false;
    },
    [propertyId]
  );

  const openPropertySelector = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_PROPERTY_SELECTOR_EVENT));
    setPopoverOpen(false);
    setAnchorEl(null);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    setAnchorEl(null);
  }, []);

  return {
    isPropertySelected: propertyId > 0,
    requireProperty,
    popoverOpen,
    popoverAnchorEl: anchorEl,
    closePopover,
    openPropertySelector,
  };
}
