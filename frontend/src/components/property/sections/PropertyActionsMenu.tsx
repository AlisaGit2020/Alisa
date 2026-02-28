import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, Stack, Alert } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import RuleIcon from '@mui/icons-material/Rule';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HomeIcon from '@mui/icons-material/Home';
import SellIcon from '@mui/icons-material/Sell';
import { Property, PropertyStatus, PropertyExternalSource, propertyExternalSourceNames } from '@asset-types';
import AssetDialog from '../../asset/dialog/AssetDialog';
import AssetButton from '../../asset/form/AssetButton';
import AssetNumberField from '../../asset/form/AssetNumberField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
import ApiClient from '@asset-lib/api-client';

interface PropertyActionsMenuProps {
  property: Property;
  onEdit: () => void;
  onOpenAllocationRules: () => void;
  onToggleAdvancedReports?: () => void;
  onPropertyUpdated?: (property: Property) => void;
}

interface PurchaseFormData {
  purchaseDate: Date | null;
  purchasePrice: number | '';
  purchaseLoan: number | '';
  ownershipShare: number | '';
}

interface SaleFormData {
  saleDate: Date | null;
  salePrice: number | '';
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
  onPropertyUpdated,
}: PropertyActionsMenuProps) {
  const { t } = useTranslation('property');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Dialog states
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [showPurchaseCongrats, setShowPurchaseCongrats] = useState(false);
  const [showSaleCongrats, setShowSaleCongrats] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form data
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>({
    purchaseDate: new Date(),
    purchasePrice: property.purchasePrice ?? '',
    purchaseLoan: property.purchaseLoan ?? '',
    ownershipShare: property.ownerships?.[0]?.share ?? 100,
  });

  const [saleForm, setSaleForm] = useState<SaleFormData>({
    saleDate: new Date(),
    salePrice: property.salePrice ?? '',
  });

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

  const handleOpenPurchaseDialog = () => {
    handleClose();
    setPurchaseDialogOpen(true);
  };

  const handleOpenSaleDialog = () => {
    handleClose();
    setSaleDialogOpen(true);
  };

  const handlePurchaseSubmit = async () => {
    setLoading(true);
    try {
      const updatedProperty = await ApiClient.put<Partial<Property>>('real-estate/property', property.id, {
        name: property.name,
        size: property.size,
        status: PropertyStatus.OWN,
        purchaseDate: purchaseForm.purchaseDate ?? undefined,
        purchasePrice: purchaseForm.purchasePrice || undefined,
        purchaseLoan: purchaseForm.purchaseLoan || undefined,
      }) as Property;
      setPurchaseDialogOpen(false);
      setShowPurchaseCongrats(true);
      onPropertyUpdated?.(updatedProperty);
    } catch (error) {
      console.error('Failed to update property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaleSubmit = async () => {
    setLoading(true);
    try {
      const updatedProperty = await ApiClient.put<Partial<Property>>('real-estate/property', property.id, {
        name: property.name,
        size: property.size,
        status: PropertyStatus.SOLD,
        saleDate: saleForm.saleDate ?? undefined,
        salePrice: saleForm.salePrice || undefined,
      }) as Property;
      setSaleDialogOpen(false);
      setShowSaleCongrats(true);
      onPropertyUpdated?.(updatedProperty);
    } catch (error) {
      console.error('Failed to update property:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMarkAsPurchased = property.status === PropertyStatus.PROSPECT;
  const showMarkAsSold = property.status === PropertyStatus.OWN;
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
        {showMarkAsPurchased && (
          <MenuItem onClick={handleOpenPurchaseDialog}>
            <ListItemIcon>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            {t('markAsPurchased')}
          </MenuItem>
        )}
        {showMarkAsSold && (
          <MenuItem onClick={handleOpenSaleDialog}>
            <ListItemIcon>
              <SellIcon fontSize="small" />
            </ListItemIcon>
            {t('markAsSold')}
          </MenuItem>
        )}
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

      {/* Purchase Dialog */}
      <AssetDialog
        open={purchaseDialogOpen}
        title={t('purchaseDialogTitle')}
        onClose={() => setPurchaseDialogOpen(false)}
        actions={
          <>
            <AssetButton
              label={t('common:cancel')}
              variant="text"
              onClick={() => setPurchaseDialogOpen(false)}
              disabled={loading}
            />
            <AssetButton
              label={t('common:confirm')}
              onClick={handlePurchaseSubmit}
              loading={loading}
            />
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <AssetDatePicker
            label={t('purchaseDate')}
            value={purchaseForm.purchaseDate}
            onChange={(value) => setPurchaseForm(prev => ({
              ...prev,
              purchaseDate: value?.toDate() ?? null
            }))}
          />
          <AssetNumberField
            label={t('purchasePrice')}
            value={purchaseForm.purchasePrice}
            adornment="€"
            onChange={(e) => setPurchaseForm(prev => ({
              ...prev,
              purchasePrice: e.target.value ? Number(e.target.value) : ''
            }))}
          />
          <AssetNumberField
            label={t('purchaseLoan')}
            value={purchaseForm.purchaseLoan}
            adornment="€"
            onChange={(e) => setPurchaseForm(prev => ({
              ...prev,
              purchaseLoan: e.target.value ? Number(e.target.value) : ''
            }))}
          />
          <AssetNumberField
            label={t('ownershipShare')}
            value={purchaseForm.ownershipShare}
            adornment="%"
            onChange={(e) => setPurchaseForm(prev => ({
              ...prev,
              ownershipShare: e.target.value ? Number(e.target.value) : ''
            }))}
          />
        </Stack>
      </AssetDialog>

      {/* Sale Dialog */}
      <AssetDialog
        open={saleDialogOpen}
        title={t('saleDialogTitle')}
        onClose={() => setSaleDialogOpen(false)}
        actions={
          <>
            <AssetButton
              label={t('common:cancel')}
              variant="text"
              onClick={() => setSaleDialogOpen(false)}
              disabled={loading}
            />
            <AssetButton
              label={t('common:confirm')}
              onClick={handleSaleSubmit}
              loading={loading}
            />
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <AssetDatePicker
            label={t('saleDate')}
            value={saleForm.saleDate}
            onChange={(value) => setSaleForm(prev => ({
              ...prev,
              saleDate: value?.toDate() ?? null
            }))}
          />
          <AssetNumberField
            label={t('salePrice')}
            value={saleForm.salePrice}
            adornment="€"
            onChange={(e) => setSaleForm(prev => ({
              ...prev,
              salePrice: e.target.value ? Number(e.target.value) : ''
            }))}
          />
        </Stack>
      </AssetDialog>

      {/* Purchase Congratulations Dialog */}
      <AssetDialog
        open={showPurchaseCongrats}
        title={t('markAsPurchased')}
        onClose={() => setShowPurchaseCongrats(false)}
        actions={
          <AssetButton
            label={t('common:close')}
            onClick={() => setShowPurchaseCongrats(false)}
          />
        }
      >
        <Alert severity="success" sx={{ mt: 1 }}>
          {t('congratulationsPurchase')}
        </Alert>
      </AssetDialog>

      {/* Sale Congratulations Dialog */}
      <AssetDialog
        open={showSaleCongrats}
        title={t('markAsSold')}
        onClose={() => setShowSaleCongrats(false)}
        actions={
          <AssetButton
            label={t('common:close')}
            onClick={() => setShowSaleCongrats(false)}
          />
        }
      >
        <Alert severity="success" sx={{ mt: 1 }}>
          {t('congratulationsSale')}
        </Alert>
      </AssetDialog>
    </Box>
  );
}

export default PropertyActionsMenu;
