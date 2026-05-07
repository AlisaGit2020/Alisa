import { Grid, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalculateIcon from '@mui/icons-material/Calculate';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { Property, PropertyStatus, CurrentCharges } from '@asset-types';
import { formatCurrency, formatDate } from '@asset-lib/format-utils';
import ApiClient from '@asset-lib/api-client';
import PropertyInfoCard from '../shared/PropertyInfoCard';
import DetailRow from '../shared/DetailRow';
import EditableDetailRow from '../shared/EditableDetailRow';
import { useEditableSection } from '../shared/useEditableSection';
import { usePropertyFieldSave } from '../shared/usePropertyFieldSave';
import PropertyChargeDialog from './PropertyChargeDialog';

interface PropertyInfoSectionProps {
  property: Property;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  onPropertyUpdated: (updated: Property) => void;
}

function PropertyInfoSection({
  property,
  activeKey,
  setActiveKey,
  onPropertyUpdated,
}: PropertyInfoSectionProps) {
  const { t } = useTranslation('property');
  const [currentCharges, setCurrentCharges] = useState<CurrentCharges | null>(null);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  const saveField = usePropertyFieldSave(property, onPropertyUpdated);

  const propertyInfo = useEditableSection(activeKey, setActiveKey, 'property-info');
  const location = useEditableSection(activeKey, setActiveKey, 'location');
  const purchase = useEditableSection(activeKey, setActiveKey, 'purchase');
  const sale = useEditableSection(activeKey, setActiveKey, 'sale');

  const renderPencil = (section: { editing: boolean; toggle: () => void }) => (
    <Tooltip title={section.editing ? t('doneEditing') : t('editSection')}>
      <IconButton
        size="small"
        onClick={section.toggle}
        aria-label={section.editing ? t('doneEditing') : t('editSection')}
      >
        {section.editing ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const charges = await ApiClient.request<CurrentCharges>({
          method: 'GET',
          url: `/real-estate/property/${property.id}/charges/current`,
        });
        setCurrentCharges(charges);
      } catch {
        // Silently fail - charges will show as empty
      }
    };
    fetchCharges();
  }, [property.id]);

  const handleChargesUpdated = () => {
    // Refetch charges
    ApiClient.request<CurrentCharges>({
      method: 'GET',
      url: `/real-estate/property/${property.id}/charges/current`,
    }).then(setCurrentCharges);
  };

  const hasCosts =
    currentCharges !== null &&
    (currentCharges.maintenanceFee !== null ||
      currentCharges.waterPrepayment !== null ||
      currentCharges.financialCharge !== null ||
      currentCharges.otherChargeBased !== null);

  const totalMonthlyCosts =
    (currentCharges?.maintenanceFee ?? 0) +
    (currentCharges?.waterPrepayment ?? 0) +
    (currentCharges?.financialCharge ?? 0) +
    (currentCharges?.otherChargeBased ?? 0);

  const pricePerSqm =
    property.purchasePrice && property.size > 0
      ? Math.round(property.purchasePrice / property.size)
      : null;

  return (
    <Grid container spacing={2}>
      {/* Property Info Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('propertyInfo')} action={renderPencil(propertyInfo)}>
          <EditableDetailRow
            icon={<SquareFootIcon fontSize="small" />}
            label={t('size')}
            value={property.size}
            editing={propertyInfo.editing}
            inputType="number"
            min={1}
            max={1000}
            onSave={(v) => saveField({ size: v as number })}
            format={(v) => `${v} m²`}
          />
          <EditableDetailRow
            icon={<CalendarTodayIcon fontSize="small" />}
            label={t('buildYear')}
            value={property.buildYear ?? null}
            editing={propertyInfo.editing}
            inputType="number"
            min={1800}
            max={2100}
            onSave={(v) => saveField({ buildYear: v as number })}
          />
          {pricePerSqm !== null && !propertyInfo.editing && (
            <DetailRow
              icon={<CalculateIcon fontSize="small" />}
              label={t('pricePerSqm')}
              value={formatCurrency(pricePerSqm)}
            />
          )}
        </PropertyInfoCard>
      </Grid>

      {/* Location Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard title={t('locationInfo')} action={renderPencil(location)}>
          <EditableDetailRow
            icon={<LocationOnIcon fontSize="small" />}
            label={t('street')}
            value={property.address?.street ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { street: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<LocationCityIcon fontSize="small" />}
            label={t('postalCode')}
            value={property.address?.postalCode ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { postalCode: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<LocationCityIcon fontSize="small" />}
            label={t('city')}
            value={property.address?.city ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { city: (v as string) ?? '' } as never })}
          />
          <EditableDetailRow
            icon={<MapIcon fontSize="small" />}
            label={t('district')}
            value={property.address?.district ?? null}
            editing={location.editing}
            inputType="text"
            onSave={(v) => saveField({ address: { district: (v as string) ?? '' } as never })}
          />
        </PropertyInfoCard>
      </Grid>

      {/* Monthly Costs Card - always show so users can add charges */}
      <Grid size={{ xs: 12, md: 6 }}>
        <PropertyInfoCard
          title={t('monthlyCostsSection')}
          action={
            <Tooltip title={t('manageCharges')}>
              <IconButton
                size="small"
                onClick={() => setChargeDialogOpen(true)}
                aria-label={t('manageCharges')}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          {hasCosts ? (
            <>
              {currentCharges?.maintenanceFee !== null && currentCharges?.maintenanceFee !== undefined && (
                <DetailRow
                  icon={<HomeWorkIcon fontSize="small" />}
                  label={t('maintenanceFee')}
                  value={`${formatCurrency(currentCharges.maintenanceFee, 2)}${t('perMonth')}`}
                />
              )}
              {currentCharges?.waterPrepayment !== null && currentCharges?.waterPrepayment !== undefined && (
                <DetailRow
                  icon={<WaterDropIcon fontSize="small" />}
                  label={t('waterPrepayment')}
                  value={`${formatCurrency(currentCharges.waterPrepayment, 2)}${t('perMonth')}`}
                />
              )}
              {currentCharges?.financialCharge !== null && currentCharges?.financialCharge !== undefined && (
                <DetailRow
                  icon={<AccountBalanceIcon fontSize="small" />}
                  label={t('financialCharge')}
                  value={`${formatCurrency(currentCharges.financialCharge, 2)}${t('perMonth')}`}
                />
              )}
              {currentCharges?.otherChargeBased !== null && currentCharges?.otherChargeBased !== undefined && (
                <DetailRow
                  icon={<ReceiptLongIcon fontSize="small" />}
                  label={t('chargeTypes.other-charge-based')}
                  value={`${formatCurrency(currentCharges.otherChargeBased, 2)}${t('perMonth')}`}
                />
              )}
              {totalMonthlyCosts > 0 && (
                <DetailRow
                  icon={<CalculateIcon fontSize="small" />}
                  label={t('totalMonthlyCosts')}
                  value={`${formatCurrency(totalMonthlyCosts, 2)}${t('perMonth')}`}
                />
              )}
            </>
          ) : (
            <DetailRow
              icon={<CalculateIcon fontSize="small" />}
              label={t('noCharges')}
              value={t('addCharge')}
            />
          )}
        </PropertyInfoCard>
      </Grid>

      {/* Purchase Details Card */}
      {(property.status === PropertyStatus.OWN || property.status === PropertyStatus.SOLD) && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('purchaseInfoSection')} action={renderPencil(purchase)}>
            <EditableDetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('purchaseDate')}
              value={property.purchaseDate ?? null}
              editing={purchase.editing}
              inputType="date"
              onSave={(v) => saveField({ purchaseDate: (v as Date) ?? undefined })}
              format={(v) => formatDate(v as Date)}
            />
            <EditableDetailRow
              icon={<AccountBalanceIcon fontSize="small" />}
              label={t('purchaseLoan')}
              value={property.purchaseLoan ?? null}
              editing={purchase.editing}
              inputType="currency"
              onSave={(v) => saveField({ purchaseLoan: (v as number) ?? undefined })}
              format={(v) => formatCurrency(v as number)}
            />
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Sale Details Card - only for SOLD */}
      {property.status === PropertyStatus.SOLD && (
        <Grid size={{ xs: 12, md: 6 }}>
          <PropertyInfoCard title={t('saleInfoSection')} action={renderPencil(sale)}>
            <EditableDetailRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label={t('saleDate')}
              value={property.saleDate ?? null}
              editing={sale.editing}
              inputType="date"
              onSave={(v) => saveField({ saleDate: (v as Date) ?? undefined })}
              format={(v) => formatDate(v as Date)}
            />
          </PropertyInfoCard>
        </Grid>
      )}

      {/* Charge History Dialog */}
      <PropertyChargeDialog
        open={chargeDialogOpen}
        propertyId={property.id}
        onClose={() => setChargeDialogOpen(false)}
        onChargesUpdated={handleChargesUpdated}
      />
    </Grid>
  );
}

export default PropertyInfoSection;
