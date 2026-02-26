import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import RuleIcon from '@mui/icons-material/Rule';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Property, PropertyStatus, PropertyExternalSource, propertyExternalSourceNames } from '@asset-types';

interface PropertyActionsMenuProps {
  property: Property;
  onEdit: () => void;
  onOpenAllocationRules: () => void;
  onToggleAdvancedReports?: () => void;
}

function getExternalListingUrl(source: PropertyExternalSource, sourceId: string): string {
  switch (source) {
    case PropertyExternalSource.ETUOVI:
      return `https://www.etuovi.com/kohde/${sourceId}`;
    case PropertyExternalSource.OIKOTIE:
      return `https://asunnot.oikotie.fi/myytavat-asunnot/${sourceId}`;
    default:
      return '';
  }
}

function PropertyActionsMenu({
  property,
  onEdit,
  onOpenAllocationRules,
  onToggleAdvancedReports,
}: PropertyActionsMenuProps) {
  const { t } = useTranslation('property');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
    onEdit();
  };

  const handleAllocationRules = () => {
    handleClose();
    onOpenAllocationRules();
  };

  const handleViewOriginalListing = () => {
    handleClose();
    if (property.externalSource && property.externalSourceId) {
      const url = getExternalListingUrl(property.externalSource, property.externalSourceId);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleAdvancedReports = () => {
    handleClose();
    onToggleAdvancedReports?.();
  };

  const showAllocationRules = property.status !== PropertyStatus.PROSPECT;
  const showAdvancedReports = property.status !== PropertyStatus.PROSPECT && onToggleAdvancedReports;
  const showOriginalListing = property.status === PropertyStatus.PROSPECT &&
    property.externalSource &&
    property.externalSourceId;

  const sourceName = property.externalSource
    ? propertyExternalSourceNames.get(property.externalSource)
    : '';

  return (
    <Box>
      <IconButton
        aria-label="property actions"
        aria-controls={open ? 'property-actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="property-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          {t('editProperty')}
        </MenuItem>
        {showAllocationRules && (
          <MenuItem onClick={handleAllocationRules}>
            <ListItemIcon>
              <RuleIcon fontSize="small" />
            </ListItemIcon>
            {t('allocation:rules', 'Allocation Rules')}
          </MenuItem>
        )}
        {showAdvancedReports && (
          <MenuItem onClick={handleAdvancedReports}>
            <ListItemIcon>
              <AssessmentIcon fontSize="small" />
            </ListItemIcon>
            {t('report.advancedReports')}
          </MenuItem>
        )}
        {showOriginalListing && (
          <MenuItem onClick={handleViewOriginalListing}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            {t('viewOnSource', { source: sourceName })}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default PropertyActionsMenu;
