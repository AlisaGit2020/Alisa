import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { ChargeType, PropertyCharge } from '@asset-types';

interface SeasonCardProps {
  charges: PropertyCharge[];
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  onEdit?: () => void;
}

const CHARGE_TYPE_ORDER = [
  ChargeType.MAINTENANCE_FEE,
  ChargeType.FINANCIAL_CHARGE,
  ChargeType.WATER_PREPAYMENT,
  ChargeType.OTHER_CHARGE_BASED,
];

function SeasonCard({ charges, startDate, endDate, isActive, onEdit }: SeasonCardProps) {
  const { t } = useTranslation('property');

  const getChargeAmount = (chargeType: ChargeType): number => {
    const charge = charges.find(c => c.chargeType === chargeType);
    return charge?.amount ?? 0;
  };

  const totalCharge = charges.find(c => c.chargeType === ChargeType.TOTAL_CHARGE);
  const total = totalCharge?.amount ?? 0;

  const formatDate = (date: string) => {
    return t('format.date', {
      val: new Date(date),
      formatParams: { val: { year: 'numeric', month: 'numeric', day: 'numeric' } },
    });
  };

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: isActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          {isActive && (
            <Typography variant="caption" color="text.secondary">
              {t('currentSeason')}
            </Typography>
          )}
          <Typography variant="subtitle2" fontWeight={600}>
            {formatDate(startDate)} → {endDate ? formatDate(endDate) : t('ongoing')}
          </Typography>
        </Box>
        {isActive && onEdit && (
          <Tooltip title={t('editCharge')}>
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Charge cards grid */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        {CHARGE_TYPE_ORDER.map(chargeType => {
          const amount = getChargeAmount(chargeType);
          const typeName = charges.find(c => c.chargeType === chargeType)?.typeName;
          if (amount === 0 && !isActive) return null;

          return (
            <Box
              key={chargeType}
              sx={{
                flex: '1 1 0',
                minWidth: 70,
                textAlign: 'center',
                py: 1,
                px: 0.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {t(`chargeTypes.${typeName || 'maintenance-fee'}`).split(' ')[0]}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                €{amount}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Total */}
      <Box
        sx={{
          textAlign: 'center',
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {t('total')}
        </Typography>
        <Typography variant="h6" fontWeight={700} component="span" sx={{ ml: 1 }}>
          €{total}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9, ml: 0.5 }}>
          {t('perMonth')}
        </Typography>
      </Box>
    </Box>
  );
}

export default SeasonCard;
